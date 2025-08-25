from fastapi import FastAPI, HTTPException, Depends, status
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

# Security configuration
SECRET_KEY = "game-parlour-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Database setup
SQLITE_DATABASE_URL = "sqlite:///./game_parlour.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
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
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Game Parlour Management System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
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
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
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
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
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
    """Generate QR code for table"""
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
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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

@app.get("/super-admin/organizations", response_model=list[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    return db.query(Organization).all()

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
    
    # Check subscription limits
    current_tables = db.query(Table).filter(
        Table.organization_id == current_user.organization_id,
        Table.is_active == 1
    ).count()
    
    if not check_subscription_limits(user_org, "tables", current_tables):
        raise HTTPException(
            status_code=403, 
            detail=f"Table limit reached. Current plan allows {user_org.max_tables} tables. Upgrade your plan."
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
    duration_hours = duration_minutes / 60
    total_charge = round(duration_hours * table.rate_per_hour, 2)
    
    # Update session
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
