from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./game_parlour.db"
    
    # Security
    secret_key: str = "game-parlour-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    
    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    
    # App Settings
    environment: str = "development"
    debug: bool = True
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    
    # Frontend
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def get_allowed_origins(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

# Global settings instance
settings = Settings()

# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "currency": "INR",
        "max_tables": 5,
        "max_staff": 2,
        "features": [
            "Basic table management",
            "Session tracking",
            "QR code generation",
            "Email support"
        ]
    },
    "premium": {
        "name": "Premium",
        "price": 4900,  # ₹49 in paise
        "currency": "INR",
        "max_tables": 25,
        "max_staff": 10,
        "features": [
            "All Free features",
            "Advanced analytics",
            "Multi-staff management",
            "Priority support",
            "Custom branding"
        ]
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 14900,  # ₹149 in paise
        "currency": "INR", 
        "max_tables": -1,  # Unlimited
        "max_staff": -1,   # Unlimited
        "features": [
            "All Premium features",
            "Unlimited tables & staff",
            "Multi-location support",
            "API access",
            "Dedicated support",
            "Custom integrations"
        ]
    }
}
