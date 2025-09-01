import razorpay
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from settings import settings, SUBSCRIPTION_PLANS

class PaymentService:
    def __init__(self):
        try:
            if (settings.razorpay_key_id and settings.razorpay_key_secret and 
                settings.razorpay_key_id.strip() and settings.razorpay_key_secret.strip()):
                self.client = razorpay.Client(
                    auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
                )
                print(f"✅ Razorpay initialized successfully with key: {settings.razorpay_key_id[:12]}...")
            else:
                self.client = None
                print("⚠️ Razorpay not configured - payment features disabled")
                print(f"Debug: key_id='{settings.razorpay_key_id}', key_secret='{settings.razorpay_key_secret[:4]}...' if present")
        except Exception as e:
            self.client = None
            print(f"❌ Razorpay initialization failed: {e}")
    
    def create_subscription_plan(self, plan_type: str) -> Optional[Dict[str, Any]]:
        """Create a subscription plan in Razorpay"""
        if not self.client:
            return None
            
        plan_config = SUBSCRIPTION_PLANS.get(plan_type)
        if not plan_config or plan_config["price"] == 0:
            return None  # Free plan doesn't need Razorpay
        
        try:
            plan_data = {
                "period": "monthly",
                "interval": 1,
                "item": {
                    "name": f"Game Parlour {plan_config['name']} Plan",
                    "amount": plan_config["price"],
                    "currency": plan_config["currency"],
                    "description": f"Monthly subscription for {plan_config['name']} plan"
                }
            }
            
            plan = self.client.plan.create(plan_data)
            return plan
        except Exception as e:
            print(f"Error creating Razorpay plan: {e}")
            return None
    
    def create_subscription(self, 
                          organization_id: int, 
                          plan_type: str, 
                          customer_email: str,
                          customer_name: str) -> Optional[Dict[str, Any]]:
        """Create a subscription for an organization"""
        if not self.client:
            return None
            
        plan_config = SUBSCRIPTION_PLANS.get(plan_type)
        if not plan_config or plan_config["price"] == 0:
            return {"status": "free_plan", "message": "Free plan activated"}
        
        try:
            # Create customer
            customer_data = {
                "name": customer_name,
                "email": customer_email,
                "notes": {
                    "organization_id": str(organization_id),
                    "plan_type": plan_type
                }
            }
            customer = self.client.customer.create(customer_data)
            
            # Create subscription
            subscription_data = {
                "plan_id": f"plan_{plan_type}",  # You'll need to create these plans in Razorpay dashboard
                "customer_id": customer["id"],
                "total_count": 12,  # 12 months
                "start_at": int((datetime.now() + timedelta(minutes=5)).timestamp()),
                "notes": {
                    "organization_id": str(organization_id),
                    "plan_type": plan_type
                }
            }
            
            subscription = self.client.subscription.create(subscription_data)
            return subscription
        except Exception as e:
            print(f"Error creating subscription: {e}")
            return None
    
    def verify_payment_signature(self, razorpay_payment_id: str, 
                                razorpay_subscription_id: str, 
                                razorpay_signature: str) -> bool:
        """Verify Razorpay webhook signature"""
        if not self.client:
            return False
            
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_subscription_id': razorpay_subscription_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except Exception as e:
            print(f"Payment verification failed: {e}")
            return False
    
    def get_subscription_details(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription details from Razorpay"""
        if not self.client:
            return None
            
        try:
            subscription = self.client.subscription.fetch(subscription_id)
            return subscription
        except Exception as e:
            print(f"Error fetching subscription: {e}")
            return None
    
    def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription"""
        if not self.client:
            return False
            
        try:
            result = self.client.subscription.cancel(subscription_id)
            return result.get("status") == "cancelled"
        except Exception as e:
            print(f"Error cancelling subscription: {e}")
            return False
    
    def create_order(self, 
                    amount: int, 
                    description: str,
                    customer_email: str,
                    session_id: str,
                    organization_id: int) -> Optional[Dict[str, Any]]:
        """Create a Razorpay order for checkout"""
        if not self.client:
            return None
            
        try:
            order_data = {
                "amount": amount,  # Amount in paise (smallest currency unit)
                "currency": "INR",
                "notes": {
                    "session_id": session_id,
                    "organization_id": str(organization_id),
                    "customer_email": customer_email,
                    "description": description
                }
            }
            
            order = self.client.order.create(order_data)
            return order
        except Exception as e:
            print(f"Error creating Razorpay order: {e}")
            return None
    
    def create_payment_link(self, 
                           amount: int, 
                           description: str,
                           customer_email: str,
                           organization_id: int) -> Optional[str]:
        """Create a payment link for one-time payments (legacy method)"""
        if not self.client:
            return None
            
        try:
            payment_link_data = {
                "amount": amount,
                "currency": "INR",
                "description": description,
                "customer": {
                    "email": customer_email
                },
                "notify": {
                    "sms": True,
                    "email": True
                },
                "callback_url": f"{settings.frontend_url}/payment/success",
                "callback_method": "get",
                "notes": {
                    "organization_id": str(organization_id)
                }
            }
            
            payment_link = self.client.payment_link.create(payment_link_data)
            return payment_link.get("short_url")
        except Exception as e:
            print(f"Error creating payment link: {e}")
            return None

# Global payment service instance
payment_service = PaymentService()

def get_plan_limits(plan_type: str) -> Dict[str, int]:
    """Get limits for a subscription plan"""
    plan = SUBSCRIPTION_PLANS.get(plan_type, SUBSCRIPTION_PLANS["free"])
    return {
        "max_tables": plan["max_tables"],
        "max_staff": plan["max_staff"]
    }

def validate_plan_usage(organization, resource_type: str, current_count: int) -> bool:
    """Validate if organization can add more resources based on their plan"""
    limits = get_plan_limits(organization.subscription_plan)
    
    if resource_type == "tables":
        max_limit = limits["max_tables"]
    elif resource_type == "staff":
        max_limit = limits["max_staff"]
    else:
        return True
    
    # -1 means unlimited
    if max_limit == -1:
        return True
        
    return current_count < max_limit
