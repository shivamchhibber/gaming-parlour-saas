from pydantic import BaseModel, EmailStr
from typing import Optional

# Public Signup Models
class GameParlourSignup(BaseModel):
    # Business Information
    business_name: str
    description: Optional[str] = None
    address: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    
    # Owner Information
    owner_name: str
    owner_email: EmailStr
    owner_phone: Optional[str] = None
    owner_password: str  # They set their own password
    
    # Business Details
    expected_tables: Optional[int] = 5
    business_type: Optional[str] = "gaming_parlour"  # gaming_parlour, cyber_cafe, arcade
    
    # Terms and Marketing
    agreed_to_terms: bool
    marketing_consent: bool = False

class SignupResponse(BaseModel):
    message: str
    organization_id: int
    status: str  # "pending_approval", "approved", "rejected"
    owner_username: str
    next_steps: list[str]

class SignupStatusCheck(BaseModel):
    email: str

class SignupApproval(BaseModel):
    organization_id: int
    approved: bool
    rejection_reason: Optional[str] = None
