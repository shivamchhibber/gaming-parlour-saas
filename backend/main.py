from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import qrcode
import io
import base64
from typing import Optional
import json

# Import settings and services
from settings import settings, SUBSCRIPTION_PLANS
from payment_service import payment_service, get_plan_limits, validate_plan_usage
from signup_models import GameParlourSignup, SignupResponse, SignupStatusCheck, SignupApproval

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Database setup
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # Game Parlour Business Name
    slug = Column(String, unique=True, index=True)  # URL-safe identifier
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String)
    contact_phone = Column(String, nullable=True)
    
    # SaaS Features
    subscription_plan = Column(String, default="free")  # free, premium, enterprise
    subscription_status = Column(String, default="pending")  # pending, active, suspended, cancelled
    is_whitelisted = Column(Boolean, default=False)  # Requires super admin approval
    max_tables = Column(Integer, default=5)  # Free plan limit
    max_staff = Column(Integer, default=2)  # Free plan limit
    
    # Payment & Subscription
    razorpay_customer_id = Column(String, nullable=True)
    razorpay_subscription_id = Column(String, nullable=True)
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription_expires_at = Column(DateTime, nullable=True)
    
    # Owner info
    owner_name = Column(String)
    owner_email = Column(String)
    owner_phone = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Enhanced Role System
    role = Column(String, default="staff")  # super_admin, org_owner, org_admin, staff
    organization_id = Column(Integer, nullable=True)  # NULL for super_admin
    
    # User Info
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Legacy field (for backward compatibility)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, index=True)  # Multi-tenant isolation
    table_number = Column(String, index=True)  # No longer globally unique
    rate_per_hour = Column(Float)
    qr_code = Column(Text)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class GameSession(Base):
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, index=True)  # Multi-tenant isolation
    session_id = Column(String, unique=True, index=True)
    table_id = Column(Integer)
    user_name = Column(String)
    user_phone = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    total_charge = Column(Float, nullable=True)
    status = Column(String, default="active")  # active, completed
    payment_status = Column(String, default="pending")  # pending, paid, cash
    payment_method = Column(String, nullable=True)  # upi, card, cash, wallet
    transaction_id = Column(String, nullable=True)
    payment_timestamp = Column(DateTime, nullable=True)  # When payment was completed
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Game Parlour Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),  # From settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_superuser: bool

class TableCreate(BaseModel):
    table_number: str
    rate_per_hour: float

class TableResponse(BaseModel):
    id: int
    table_number: str
    rate_per_hour: float
    qr_code: str
    is_active: int

class UserDetails(BaseModel):
    name: str
    phone: str
    table_id: int

class SessionStart(BaseModel):
    session_id: str
    table_id: int
    user_name: str
    user_phone: str

class SessionEnd(BaseModel):
    session_id: str

class PaymentProcess(BaseModel):
    session_id: str
    payment_method: str  # upi, card, cash, wallet
    transaction_id: str = None

# SaaS Pydantic Models
class OrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    owner_name: str
    owner_email: str
    owner_phone: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    address: Optional[str]
    contact_email: str
    contact_phone: Optional[str]
    subscription_plan: str
    subscription_status: str
    is_whitelisted: bool
    max_tables: int
    max_staff: int
    created_at: datetime
    owner_name: str
    owner_email: str
    owner_phone: Optional[str]

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    is_whitelisted: Optional[bool] = None
    max_tables: Optional[int] = None
    max_staff: Optional[int] = None

class UserCreateSaaS(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "staff"  # super_admin, org_owner, org_admin, staff
    organization_id: Optional[int] = None

class UserResponseSaaS(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    organization_id: Optional[int]
    is_active: bool
    created_at: datetime

# Subscription Management Models
class SubscriptionPlanResponse(BaseModel):
    name: str
    price: int
    currency: str
    max_tables: int
    max_staff: int
    features: list[str]

class SubscriptionCreate(BaseModel):
    organization_id: int
    plan_type: str  # free, premium, enterprise

class SubscriptionResponse(BaseModel):
    id: str
    status: str
    plan_type: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    next_billing_date: Optional[datetime]

class PaymentLinkCreate(BaseModel):
    amount: int
    description: str
    organization_id: int

class WebhookPayload(BaseModel):
    event: str
    payload: dict

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Utility functions
def generate_qr_code(table_id: int, table_number: str) -> str:
    """Generate QR code for table - Updated for unified dashboard flow"""
    # Keep existing URL structure as it redirects to dashboard seamlessly
    qr_data = f"http://localhost:3000/user/scan/{table_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# SaaS Helper Functions
def create_organization_slug(name: str) -> str:
    """Create URL-safe slug from organization name"""
    import re
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'\s+', '-', slug.strip())
    return slug[:50]  # Limit length

def check_organization_access(user: User, organization_id: int) -> bool:
    """Check if user has access to organization"""
    if user.role == "super_admin":
        return True
    return user.organization_id == organization_id

def get_user_organization(user: User, db: Session):
    """Get user's organization"""
    if user.organization_id:
        return db.query(Organization).filter(Organization.id == user.organization_id).first()
    return None

def check_subscription_limits(org: Organization, resource_type: str, current_count: int) -> bool:
    """Check if organization has reached subscription limits"""
    if resource_type == "tables":
        return current_count < org.max_tables
    elif resource_type == "staff":
        return current_count < org.max_staff
    return True

def require_role(required_roles: list):
    """Decorator to require specific roles"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be implemented with the current user context
            pass
        return wrapper
    return decorator

# Create super admin user if not exists
def create_super_admin():
    db = SessionLocal()
    try:
        # Check if super admin already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                username="admin",
                email="admin@gameparlour.com",
                hashed_password=hashed_password,
                is_superuser=True,
                role="super_admin",  # New role system
                full_name="Super Administrator"
            )
            db.add(admin_user)
            db.commit()
            print("✅ Super admin user created: username='admin', password='admin123'")
        else:
            print("ℹ️ Super admin user already exists")
    finally:
        db.close()

# Create super admin on startup
create_super_admin()

# API Routes

@app.get("/")
async def root():
    return {"message": "Game Parlour Management System API"}

# Authentication Routes
@app.post("/auth/login", response_model=Token)
async def login_for_access_token(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponseSaaS)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/auth/create-user", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only superusers can create new users
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if user already exists
    db_user = get_user(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# SaaS Organization Management Routes (Super Admin Only)
@app.post("/super-admin/organizations", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Only super admin can create organizations
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Generate unique slug
    base_slug = create_organization_slug(org_data.name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Create organization
    db_org = Organization(
        name=org_data.name,
        slug=slug,
        description=org_data.description,
        address=org_data.address,
        contact_email=org_data.contact_email,
        contact_phone=org_data.contact_phone,
        owner_name=org_data.owner_name,
        owner_email=org_data.owner_email,
        owner_phone=org_data.owner_phone
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    
    # Create organization owner user
    owner_username = f"owner_{slug}"
    hashed_password = get_password_hash("temp123")  # Temporary password
    
    owner_user = User(
        username=owner_username,
        email=org_data.owner_email,
        hashed_password=hashed_password,
        full_name=org_data.owner_name,
        phone=org_data.owner_phone,
        role="org_owner",
        organization_id=db_org.id
    )
    db.add(owner_user)
    db.commit()
    
    print(f"✅ Organization created: {org_data.name}")
    print(f"👤 Owner credentials: username='{owner_username}', password='temp123'")
    
    return db_org

@app.get("/super-admin/organizations")
async def list_organizations(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Get organizations with owner username
    organizations = db.query(Organization).all()
    result = []
    
    for org in organizations:
        # Find the owner user for this organization
        owner_user = db.query(User).filter(
            User.organization_id == org.id,
            User.role == "organization_owner"
        ).first()
        
        org_dict = {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "description": org.description,
            "address": org.address,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "subscription_plan": org.subscription_plan,
            "subscription_status": org.subscription_status,
            "is_whitelisted": org.is_whitelisted,
            "max_tables": org.max_tables,
            "max_staff": org.max_staff,
            "created_at": org.created_at,
            "owner_name": org.owner_name,
            "owner_email": org.owner_email,
            "owner_phone": org.owner_phone,
            "owner_username": owner_user.username if owner_user else f"owner_{org.slug}"
        }
        result.append(org_dict)
    
    return result

@app.put("/super-admin/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    org_update: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Update fields
    for field, value in org_update.dict(exclude_unset=True).items():
        setattr(db_org, field, value)
    
    db.commit()
    db.refresh(db_org)
    return db_org

@app.post("/super-admin/organizations/{org_id}/reset-password")
async def reset_organization_password(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset password for organization owner (Super Admin only)"""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Find the organization
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Find the organization owner
    owner = db.query(User).filter(
        User.organization_id == org_id, 
        User.role == "org_owner"
    ).first()
    
    if not owner:
        raise HTTPException(status_code=404, detail="Organization owner not found")
    
    # Generate new temporary password
    import secrets
    import string
    new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    
    # Update password
    hashed_password = get_password_hash(new_password)
    owner.hashed_password = hashed_password
    db.commit()
    
    print(f"🔑 Password reset for {org.name}")
    print(f"👤 Username: {owner.username}")
    print(f"🔐 New Password: {new_password}")
    
    return {
        "message": "Password reset successfully",
        "organization_name": org.name,
        "owner_username": owner.username,
        "new_password": new_password,
        "instructions": "Please provide these credentials to the organization owner and ask them to change the password after first login"
    }

@app.post("/super-admin/organizations/{org_id}/whitelist")
async def whitelist_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db_org.is_whitelisted = True
    db_org.subscription_status = "active"
    db.commit()
    
    return {"message": f"Organization {db_org.name} has been whitelisted and activated"}

# Public Game Parlour Signup Routes
@app.post("/signup/game-parlour", response_model=SignupResponse)
async def signup_game_parlour(signup_data: GameParlourSignup, db: Session = Depends(get_db)):
    """Public endpoint for game parlours to self-signup"""
    
    # Validate terms agreement
    if not signup_data.agreed_to_terms:
        raise HTTPException(status_code=400, detail="You must agree to the terms and conditions")
    
    # Check if email already exists
    existing_org = db.query(Organization).filter(Organization.contact_email == signup_data.contact_email).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="An organization with this email already exists")
    
    existing_user = db.query(User).filter(User.email == signup_data.owner_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    
    # Generate unique slug
    base_slug = create_organization_slug(signup_data.business_name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Determine initial plan limits based on expected tables
    if signup_data.expected_tables and signup_data.expected_tables > 5:
        # Suggest premium plan for larger operations
        max_tables = 25
        max_staff = 10
        suggested_plan = "premium"
    else:
        max_tables = 5
        max_staff = 2
        suggested_plan = "free"
    
    # Create organization (pending approval)
    db_org = Organization(
        name=signup_data.business_name,
        slug=slug,
        description=signup_data.description,
        address=signup_data.address,
        contact_email=signup_data.contact_email,
        contact_phone=signup_data.contact_phone,
        owner_name=signup_data.owner_name,
        owner_email=signup_data.owner_email,
        owner_phone=signup_data.owner_phone,
        subscription_plan=suggested_plan,
        subscription_status="pending",
        is_whitelisted=False,  # Requires approval
        max_tables=max_tables,
        max_staff=max_staff
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    
    # Create organization owner user account
    owner_username = f"owner_{slug}"
    hashed_password = get_password_hash(signup_data.owner_password)
    
    owner_user = User(
        username=owner_username,
        email=signup_data.owner_email,
        hashed_password=hashed_password,
        full_name=signup_data.owner_name,
        phone=signup_data.owner_phone,
        role="org_owner",
        organization_id=db_org.id
    )
    db.add(owner_user)
    db.commit()
    
    # Prepare next steps
    next_steps = [
        "✅ Your account has been created successfully",
        "⏳ Your application is pending admin approval",
        "📧 You'll receive an email notification once approved",
        f"🔑 Login with username: {owner_username}",
        "💡 Consider upgrading to Premium plan for more tables"
    ]
    
    print(f"🎮 New game parlour signup: {signup_data.business_name}")
    print(f"👤 Owner: {signup_data.owner_name} ({signup_data.owner_email})")
    print(f"📍 Location: {signup_data.address}")
    
    return SignupResponse(
        message="Game parlour signup successful! Pending admin approval.",
        organization_id=db_org.id,
        status="pending_approval",
        owner_username=owner_username,
        next_steps=next_steps
    )

@app.get("/signup/status")
async def check_signup_status(email: str, db: Session = Depends(get_db)):
    """Check the status of a game parlour signup"""
    
    org = db.query(Organization).filter(Organization.contact_email == email).first()
    if not org:
        raise HTTPException(status_code=404, detail="No signup found with this email")
    
    if org.is_whitelisted and org.subscription_status == "active":
        status = "approved"
        message = "✅ Your game parlour has been approved! You can now login and start using the platform."
    elif org.subscription_status == "rejected":
        status = "rejected"
        message = "❌ Your application has been rejected. Please contact support for more information."
    else:
        status = "pending_approval"
        message = "⏳ Your application is still pending admin approval. We'll notify you once it's reviewed."
    
    return {
        "organization_name": org.name,
        "status": status,
        "message": message,
        "submitted_date": org.created_at,
        "suggested_plan": org.subscription_plan
    }

@app.post("/signup/resend-notification")
async def resend_signup_notification(email: str, db: Session = Depends(get_db)):
    """Resend signup confirmation (for future email integration)"""
    
    org = db.query(Organization).filter(Organization.contact_email == email).first()
    if not org:
        raise HTTPException(status_code=404, detail="No signup found with this email")
    
    # TODO: Implement email sending
    # send_signup_confirmation_email(org)
    
    return {"message": "Confirmation email sent (feature coming soon)"}

# Super Admin Signup Approval Routes
@app.post("/super-admin/approve-signup")
async def approve_signup(
    approval_data: SignupApproval,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve or reject a game parlour signup"""
    
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    org = db.query(Organization).filter(Organization.id == approval_data.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if approval_data.approved:
        org.is_whitelisted = True
        org.subscription_status = "active"
        status_message = f"Organization '{org.name}' has been approved and activated!"
        
        # TODO: Send approval email to owner
        print(f"✅ Approved: {org.name} ({org.contact_email})")
    else:
        org.subscription_status = "rejected"
        status_message = f"Organization '{org.name}' has been rejected."
        
        if approval_data.rejection_reason:
            # TODO: Store rejection reason and send email
            print(f"❌ Rejected: {org.name} - Reason: {approval_data.rejection_reason}")
    
    db.commit()
    return {"message": status_message}

@app.get("/super-admin/pending-signups")
async def get_pending_signups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending game parlour signups for admin review"""
    
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    pending_orgs = db.query(Organization).filter(
        Organization.is_whitelisted == False,
        Organization.subscription_status == "pending"
    ).order_by(Organization.created_at.desc()).all()
    
    return [
        {
            "id": org.id,
            "business_name": org.name,
            "owner_name": org.owner_name,
            "owner_email": org.owner_email,
            "contact_email": org.contact_email,
            "address": org.address,
            "description": org.description,
            "expected_tables": org.max_tables,
            "suggested_plan": org.subscription_plan,
            "submitted_date": org.created_at,
            "contact_phone": org.contact_phone
        }
        for org in pending_orgs
    ]

# Subscription Management Routes
@app.get("/subscription/plans", response_model=dict)
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS

@app.post("/subscription/create", response_model=dict)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription for an organization"""
    # Only super admin or org owner can create subscriptions
    if current_user.role not in ["super_admin", "org_owner"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Verify organization access
    if current_user.role == "org_owner" and current_user.organization_id != subscription_data.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to this organization")
    
    # Get organization
    org = db.query(Organization).filter(Organization.id == subscription_data.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Create subscription
    subscription = payment_service.create_subscription(
        organization_id=subscription_data.organization_id,
        plan_type=subscription_data.plan_type,
        customer_email=org.contact_email,
        customer_name=org.owner_name
    )
    
    if subscription:
        # Update organization with subscription details
        org.subscription_plan = subscription_data.plan_type
        org.subscription_status = "active"
        
        if subscription.get("razorpay_customer_id"):
            org.razorpay_customer_id = subscription["razorpay_customer_id"]
        if subscription.get("razorpay_subscription_id"):
            org.razorpay_subscription_id = subscription["razorpay_subscription_id"]
        
        # Update limits based on plan
        plan_limits = get_plan_limits(subscription_data.plan_type)
        org.max_tables = plan_limits["max_tables"]
        org.max_staff = plan_limits["max_staff"]
        
        db.commit()
        return {"message": "Subscription created successfully", "subscription": subscription}
    else:
        raise HTTPException(status_code=400, detail="Failed to create subscription")

@app.get("/subscription/organization/{org_id}")
async def get_organization_subscription(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subscription details for an organization"""
    # Check access permissions
    if current_user.role == "super_admin":
        pass  # Super admin can access any organization
    elif current_user.organization_id == org_id:
        pass  # User can access their own organization
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get current plan details
    plan_details = SUBSCRIPTION_PLANS.get(org.subscription_plan, SUBSCRIPTION_PLANS["free"])
    
    return {
        "organization_id": org.id,
        "organization_name": org.name,
        "current_plan": org.subscription_plan,
        "plan_details": plan_details,
        "subscription_status": org.subscription_status,
        "max_tables": org.max_tables,
        "max_staff": org.max_staff,
        "subscription_start_date": org.subscription_start_date,
        "subscription_end_date": org.subscription_end_date,
        "next_billing_date": org.next_billing_date,
        "razorpay_subscription_id": org.razorpay_subscription_id
    }

@app.post("/payment/create-link")
async def create_payment_link(
    payment_data: PaymentLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a payment link for one-time payments (Admin only)"""
    # Check permissions
    if current_user.role not in ["super_admin", "org_owner"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get organization
    org = db.query(Organization).filter(Organization.id == payment_data.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Create payment link
    payment_link = payment_service.create_payment_link(
        amount=payment_data.amount,
        description=payment_data.description,
        customer_email=org.contact_email,
        organization_id=payment_data.organization_id
    )
    
    if payment_link:
        return {"payment_link": payment_link, "message": "Payment link created successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to create payment link")

class SessionPaymentRequest(BaseModel):
    session_id: str

@app.post("/public/payment/session")
async def create_session_payment_link(
    request: SessionPaymentRequest,
    db: Session = Depends(get_db)
):
    """Create a payment link for a gaming session (Public endpoint)"""
    
    # Get session details
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed before payment")
    
    # Get table and organization details
    table = db.query(Table).filter(Table.id == session.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    org = db.query(Organization).filter(Organization.id == table.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Create Razorpay order for checkout
    amount_in_paise = int(session.total_charge * 100)  # Convert to paise
    description = f"Gaming Session - Table {table.table_number} - {session.user_name}"
    
    order = payment_service.create_order(
        amount=amount_in_paise,
        description=description,
        customer_email=session.user_phone + "@temp.com",  # Use phone as temp email
        session_id=session.session_id,
        organization_id=org.id
    )
    
    print(f"🔍 Debug: create_order returned: {order}")
    print(f"🔍 Debug: payment_service.client: {payment_service.client}")
    
    if order:
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "razorpay_key_id": settings.razorpay_key_id,
            "session_id": request.session_id,
            "description": description,
            "customer_name": session.user_name,
            "customer_email": session.user_phone + "@temp.com",
            "message": "Payment order created successfully"
        }
    else:
        # Return a fallback message when Razorpay is not configured
        return {
            "payment_link": None,
            "amount": session.total_charge,
            "session_id": request.session_id,
            "message": "Payment service not configured. Please pay at the counter.",
            "error": "razorpay_not_configured"
        }

@app.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhooks for payment events"""
    try:
        payload = await request.body()
        webhook_data = json.loads(payload)
        
        event = webhook_data.get("event")
        
        if event == "subscription.charged":
            # Handle successful subscription payment
            subscription_id = webhook_data["payload"]["subscription"]["entity"]["id"]
            
            # Find organization by subscription ID
            org = db.query(Organization).filter(
                Organization.razorpay_subscription_id == subscription_id
            ).first()
            
            if org:
                org.subscription_status = "active"
                # Update next billing date
                next_billing = webhook_data["payload"]["subscription"]["entity"]["current_end"]
                org.next_billing_date = datetime.fromtimestamp(next_billing)
                db.commit()
        
        elif event == "subscription.cancelled":
            # Handle subscription cancellation
            subscription_id = webhook_data["payload"]["subscription"]["entity"]["id"]
            
            org = db.query(Organization).filter(
                Organization.razorpay_subscription_id == subscription_id
            ).first()
            
            if org:
                org.subscription_status = "cancelled"
                org.subscription_plan = "free"
                org.max_tables = 5
                org.max_staff = 2
                db.commit()
        
        elif event == "payment_link.paid":
            # Handle payment link success (for gaming sessions)
            payment_link_data = webhook_data["payload"]["payment_link"]["entity"]
            notes = payment_link_data.get("notes", {})
            
            # Try to find session_id in notes or reference_id
            session_id = notes.get("session_id")
            if not session_id:
                # Try to extract from reference_id or other fields
                reference_id = payment_link_data.get("reference_id")
                if reference_id:
                    session_id = reference_id
            
            if session_id:
                # Find and update the gaming session
                session = db.query(GameSession).filter(GameSession.session_id == session_id).first()
                if session:
                    session.payment_status = "paid"
                    if webhook_data.get("payload", {}).get("payment"):
                        session.payment_id = webhook_data["payload"]["payment"]["entity"]["id"]
                    session.payment_timestamp = datetime.now()
                    db.commit()
                    print(f"✅ Payment completed for session {session_id}")
        
        elif event == "order.paid":
            # Handle order payment success (for gaming sessions)
            order_data = webhook_data["payload"]["order"]["entity"]
            notes = order_data.get("notes", {})
            session_id = notes.get("session_id")
            
            if session_id:
                # Find and update the gaming session
                session = db.query(GameSession).filter(GameSession.session_id == session_id).first()
                if session:
                    session.payment_status = "paid"
                    if webhook_data.get("payload", {}).get("payment"):
                        session.payment_id = webhook_data["payload"]["payment"]["entity"]["id"]
                    session.payment_timestamp = datetime.now()
                    db.commit()
                    print(f"✅ Payment completed for session {session_id}")
        
        return {"status": "success"}
    
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# Admin Routes (Multi-tenant Protected)
@app.post("/admin/tables", response_model=TableResponse)
async def create_table(table: TableCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"Received table data: {table}")  # Debug log
    
    # Multi-tenant access control
    if current_user.role == "super_admin":
        # Super admin needs to specify organization
        raise HTTPException(status_code=400, detail="Super admin must use organization-specific endpoints")
    
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not associated with any organization")
    
    # Get user's organization
    user_org = get_user_organization(current_user, db)
    if not user_org or not user_org.is_whitelisted:
        raise HTTPException(status_code=403, detail="Organization not whitelisted or not found")
    
    # Check subscription limits using new validation function
    current_tables = db.query(Table).filter(
        Table.organization_id == current_user.organization_id,
        Table.is_active == 1
    ).count()
    
    if not validate_plan_usage(user_org, "tables", current_tables):
        plan_details = SUBSCRIPTION_PLANS.get(user_org.subscription_plan, SUBSCRIPTION_PLANS["free"])
        raise HTTPException(
            status_code=403, 
            detail=f"Table limit reached. Current {user_org.subscription_plan} plan allows {user_org.max_tables} tables. Upgrade to {plan_details['name']} plan for more tables."
        )
    
    # Check if table already exists within organization
    existing_table = db.query(Table).filter(
        Table.organization_id == current_user.organization_id,
        Table.table_number == table.table_number
    ).first()
    if existing_table:
        raise HTTPException(status_code=400, detail="Table number already exists in your organization")
    
    # Create new table
    db_table = Table(
        organization_id=current_user.organization_id,
        table_number=table.table_number,
        rate_per_hour=table.rate_per_hour
    )
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    
    # Generate QR code
    qr_code = generate_qr_code(db_table.id, db_table.table_number)
    db_table.qr_code = qr_code
    db.commit()
    db.refresh(db_table)
    
    return db_table

@app.get("/admin/tables")
async def get_all_tables(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Multi-tenant access control
    if current_user.role == "super_admin":
        # Super admin sees all tables across all organizations
        tables = db.query(Table).filter(Table.is_active == 1).all()
    else:
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Organization users see only their organization's tables
        tables = db.query(Table).filter(
            Table.organization_id == current_user.organization_id,
            Table.is_active == 1
        ).all()
    
    return tables

@app.put("/admin/tables/{table_id}")
async def update_table(table_id: int, table: TableCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db_table.table_number = table.table_number
    db_table.rate_per_hour = table.rate_per_hour
    db.commit()
    return {"message": "Table updated successfully"}

@app.delete("/admin/tables/{table_id}")
async def delete_table(table_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db_table.is_active = 0
    db.commit()
    return {"message": "Table deleted successfully"}

# User Routes
@app.get("/table/{table_id}")
async def get_table_info(table_id: int, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.id == table_id, Table.is_active == 1).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@app.get("/table/lookup/{table_identifier}")
async def get_table_by_identifier(table_identifier: str, db: Session = Depends(get_db)):
    """Lookup table by either ID (numeric) or table_number (string)"""
    
    # Try to parse as integer first (table ID)
    try:
        table_id = int(table_identifier)
        table = db.query(Table).filter(Table.id == table_id, Table.is_active == 1).first()
        if table:
            return table
    except ValueError:
        # Not a number, continue to table_number lookup
        pass
    
    # Search by table_number (string)
    table = db.query(Table).filter(Table.table_number == table_identifier, Table.is_active == 1).first()
    if table:
        return table
    
    # Not found by either method
    raise HTTPException(status_code=404, detail=f"Table '{table_identifier}' not found")

@app.post("/session/start")
async def start_session(user_details: UserDetails, db: Session = Depends(get_db)):
    # Verify table exists
    table = db.query(Table).filter(Table.id == user_details.table_id, Table.is_active == 1).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Check if table has active session
    active_session = db.query(GameSession).filter(
        GameSession.table_id == user_details.table_id,
        GameSession.status == "active"
    ).first()
    if active_session:
        raise HTTPException(status_code=400, detail="Table is already occupied")
    
    # Create new session with organization_id from table
    session_id = str(uuid.uuid4())
    db_session = GameSession(
        organization_id=table.organization_id,  # Link to organization
        session_id=session_id,
        table_id=user_details.table_id,
        user_name=user_details.name,
        user_phone=user_details.phone,
        start_time=datetime.now()
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return {
        "session_id": session_id,
        "message": "Session started successfully",
        "start_time": db_session.start_time
    }

@app.post("/session/end")
async def end_session(session_end: SessionEnd, db: Session = Depends(get_db)):
    # Find active session
    session = db.query(GameSession).filter(
        GameSession.session_id == session_end.session_id,
        GameSession.status == "active"
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Get table info for rate calculation
    table = db.query(Table).filter(Table.id == session.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Calculate charges
    end_time = datetime.now()
    duration = end_time - session.start_time
    duration_minutes = int(duration.total_seconds() / 60)
    
    # Minimum billing duration of 15 minutes
    billing_minutes = max(duration_minutes, 15)
    duration_hours = billing_minutes / 60
    total_charge = round(duration_hours * table.rate_per_hour, 2)
    

    # Update session - store both actual and billing duration
    session.end_time = end_time
    session.duration_minutes = duration_minutes
    session.total_charge = total_charge
    session.status = "completed"
    db.commit()
    
    return {
        "session_id": session.session_id,
        "user_name": session.user_name,
        "table_number": table.table_number,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "duration_minutes": duration_minutes,
        "billing_minutes": billing_minutes,
        "rate_per_hour": table.rate_per_hour,
        "total_charge": total_charge,
        "message": "Session ended successfully"
    }

@app.get("/admin/sessions")
async def get_all_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Multi-tenant access control
    if current_user.role == "super_admin":
        # Super admin sees all sessions across all organizations
        sessions = db.query(GameSession).all()
    else:
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Organization users see only their organization's sessions
        sessions = db.query(GameSession).filter(
            GameSession.organization_id == current_user.organization_id
        ).all()
    
    return sessions

@app.get("/session/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/session/mark-unpaid")
async def mark_session_unpaid(request: SessionPaymentRequest, db: Session = Depends(get_db)):
    """Mark a session as unpaid (for cases where user skips payment)"""
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed first")
    
    # Mark as unpaid
    session.payment_status = "unpaid"
    db.commit()
    
    return {"message": "Session marked as unpaid", "session_id": request.session_id}

@app.post("/session/verify-payment")
async def verify_session_payment(request: SessionPaymentRequest, db: Session = Depends(get_db)):
    """Manually verify and mark session as paid (for payment link success)"""
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed first")
    
    # Mark session as paid
    session.payment_status = "paid"
    session.payment_timestamp = datetime.now()
    db.commit()
    
    print(f"✅ Payment manually verified for session {session.session_id}")
    
    return {
        "message": "Payment verified successfully",
        "session_id": session.session_id,
        "payment_status": "paid"
    }

@app.post("/admin/session/end-for-cash")
async def admin_end_session_for_cash(request: SessionPaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin/Owner can end a session and mark as cash payment"""
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Multi-tenant access control
    if current_user.role != "super_admin" and session.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to this session")
    
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Can only end active sessions")
    
    # End the session
    end_time = datetime.now()
    duration_minutes = int((end_time - session.start_time).total_seconds() / 60)
    
    # Get table rate for calculation
    table = db.query(Table).filter(Table.id == session.table_id).first()
    rate_per_hour = table.rate_per_hour if table else 240  # Default rate
    
    # Calculate charge
    total_charge = (duration_minutes / 60) * rate_per_hour
    
    # Update session
    session.end_time = end_time
    session.duration_minutes = duration_minutes
    session.total_charge = total_charge
    session.status = "completed"
    session.payment_status = "cash"  # Mark as cash payment
    session.payment_method = "cash"
    session.payment_timestamp = end_time
    
    db.commit()
    
    return {
        "message": "Session ended and marked as cash payment",
        "session_id": request.session_id,
        "duration_minutes": duration_minutes,
        "total_charge": total_charge,
        "payment_status": "cash"
    }

@app.post("/admin/session/mark-cash")
async def admin_mark_session_as_cash(request: SessionPaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin/Owner can mark a completed session as cash payment"""
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Multi-tenant access control
    if current_user.role != "super_admin" and session.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to this session")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Can only mark completed sessions as cash")
    
    # Mark as cash payment
    session.payment_status = "cash"
    session.payment_method = "cash"
    session.payment_timestamp = datetime.now()
    
    db.commit()
    
    return {
        "message": "Session marked as cash payment",
        "session_id": request.session_id,
        "total_charge": session.total_charge,
        "payment_status": "cash"
    }

@app.post("/admin/session/mark-paid")
async def admin_mark_session_as_paid(request: SessionPaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin/Owner can manually mark a session as paid (for online payments)"""
    session = db.query(GameSession).filter(GameSession.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Multi-tenant access control
    if current_user.role != "super_admin" and session.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to this session")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Can only mark completed sessions as paid")
    
    # Mark as online payment
    session.payment_status = "paid"
    session.payment_method = "online"
    session.payment_timestamp = datetime.now()
    
    db.commit()
    
    return {
        "message": "Session marked as paid",
        "session_id": request.session_id,
        "total_charge": session.total_charge,
        "payment_status": "paid"
    }

@app.get("/api/player/sessions/{phone_number}")
async def get_player_sessions(phone_number: str, db: Session = Depends(get_db)):
    """Get gaming sessions for a player by phone number"""
    try:
        print(f"🔍 Fetching sessions for phone: {phone_number}")
        
        # Find sessions by user phone number
        sessions = db.query(GameSession).filter(
            GameSession.user_phone == phone_number
        ).order_by(GameSession.created_at.desc()).all()
        
        print(f"🔍 Found {len(sessions)} sessions")
        
        # Get table details for each session
        session_data = []
        for session in sessions:
            try:
                table = db.query(Table).filter(Table.id == session.table_id).first()
                
                # Safe attribute access with defaults
                session_info = {
                    "id": getattr(session, 'id', 0),
                    "session_id": getattr(session, 'session_id', ''),
                    "table_number": table.table_number if table else "Unknown",
                    "start_time": getattr(session, 'start_time', None),
                    "end_time": getattr(session, 'end_time', None),
                    "duration_minutes": getattr(session, 'duration_minutes', 0) or 0,
                    "billing_minutes": getattr(session, 'duration_minutes', 0) or 0,
                    "rate_per_hour": table.rate_per_hour if table else 0,
                    "total_charge": getattr(session, 'total_charge', 0) or 0,
                    "payment_status": getattr(session, 'payment_status', 'pending') or "pending",
                    "payment_timestamp": getattr(session, 'payment_timestamp', None),
                    "payment_method": getattr(session, 'payment_method', None),
                    "created_at": getattr(session, 'created_at', None)
                }
                session_data.append(session_info)
                print(f"✅ Processed session: {session.session_id}")
            except Exception as e:
                print(f"❌ Error processing session {session.session_id}: {e}")
                continue
        
        result = {
            "phone_number": phone_number,
            "total_sessions": len(session_data),
            "sessions": session_data
        }
        
        print(f"✅ Returning {len(session_data)} sessions")
        return result
        
    except Exception as e:
        print(f"❌ Error in get_player_sessions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/player/active-session/{phone_number}")
async def get_player_active_session(phone_number: str, db: Session = Depends(get_db)):
    """Get active gaming session for a player by phone number"""
    
    # Find active session by user phone number
    active_session = db.query(GameSession).filter(
        GameSession.user_phone == phone_number,
        GameSession.status == "active"
    ).first()
    
    if not active_session:
        return {"active_session": None}
    
    # Get table details
    table = db.query(Table).filter(Table.id == active_session.table_id).first()
    
    session_info = {
        "session_id": active_session.session_id,
        "table_number": table.table_number if table else "Unknown",
        "table_id": active_session.table_id,
        "start_time": active_session.start_time,
        "user_name": active_session.user_name,
        "rate_per_hour": table.rate_per_hour if table else 0,
        "status": active_session.status
    }
    
    return {"active_session": session_info}


@app.post("/session/payment")
async def process_payment(payment: PaymentProcess, db: Session = Depends(get_db)):
    """Process payment for a completed session"""
    # Find the session
    session = db.query(GameSession).filter(GameSession.session_id == payment.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Session must be completed before payment")
    
    # Update payment information
    session.payment_status = "paid"
    session.payment_method = payment.payment_method
    session.transaction_id = payment.transaction_id or f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Payment processed successfully",
        "session_id": session.session_id,
        "payment_status": session.payment_status,
        "payment_method": session.payment_method,
        "transaction_id": session.transaction_id,
        "amount": session.total_charge
    }

@app.post("/admin/regenerate-qr-codes")
async def regenerate_qr_codes(db: Session = Depends(get_db)):
    """Regenerate QR codes for all existing tables"""
    tables = db.query(Table).filter(Table.is_active == 1).all()
    updated_count = 0
    
    for table in tables:
        # Generate new QR code with correct URL
        qr_code = generate_qr_code(table.id, table.table_number)
        table.qr_code = qr_code
        updated_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully regenerated QR codes for {updated_count} tables",
        "updated_count": updated_count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
