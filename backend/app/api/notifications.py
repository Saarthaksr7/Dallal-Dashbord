"""
Email notification API endpoints
"""
from fastapi import APIRouter, HTTPException, status
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
import logging
import smtplib

from app.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SMTPConfig(BaseModel):
    enabled: bool
    host: str
    port: int
    secure: bool
    auth: Dict[str, str]


class FromConfig(BaseModel):
    name: str
    email: EmailStr


class EmailSettings(BaseModel):
    smtp: SMTPConfig
    from_: FromConfig = None
    recipients: Optional[Dict[str, List[EmailStr]]] = None
    preferences: Optional[Dict] = None
    
    class Config:
        fields = {'from_': 'from'}


class TestEmailRequest(BaseModel):
    smtp: SMTPConfig
    from_: FromConfig = None
    to: EmailStr
    
    class Config:
        fields = {'from_': 'from'}


@router.post("/test")
async def send_test_email(request: TestEmailRequest):
    """
    Send a test email to verify SMTP configuration
    
    - **smtp**: SMTP server configuration
    - **from**: Sender information
    - **to**: Test email recipient
    """
    try:
        # Configure email service temporarily for test
        from_config = request.from_.dict() if request.from_ else {
            'name': 'Dallal Dashboard',
            'email': request.smtp.auth['user']
        }
        
        email_service.configure(
            smtp_config=request.smtp.dict(),
            from_config=from_config
        )
        
        # Send test email
        success = email_service.send_test_email(request.to)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email. Check your SMTP configuration."
            )
        
        return {
            "success": True,
            "message": f"Test email sent successfully to {request.to}"
        }
        
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SMTP authentication failed. Check your username and password."
        )
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Failed to send test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )


@router.put("/settings")
async def update_email_settings(settings: EmailSettings):
    """
    Update email notification settings
    
    Saves SMTP configuration and notification preferences
    """
    try:
        # Configure the global email service
        from_config = settings.from_.dict() if settings.from_ else {
            'name': 'Dallal Dashboard',
            'email': settings.smtp.auth['user']
        }
        
        email_service.configure(
            smtp_config=settings.smtp.dict(),
            from_config=from_config
        )
        
        # In a real app, save to database
        # For now, just configure the service
        logger.info("Email settings updated successfully")
        
        return {
            "success": True,
            "message": "Email settings updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to update email settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update email settings: {str(e)}"
        )


@router.get("/settings")
async def get_email_settings():
    """
    Get current email notification settings
    
    Returns configured SMTP settings (password masked)
    """
    # In a real app, retrieve from database
    # For now, return empty/default settings
    return {
        "smtp": {
            "enabled": email_service.smtp_config is not None,
            "host": email_service.smtp_config.get('host', '') if email_service.smtp_config else '',
            "port": email_service.smtp_config.get('port', 587) if email_service.smtp_config else 587,
            "secure": email_service.smtp_config.get('secure', False) if email_service.smtp_config else False,
            "auth": {
                "user": email_service.smtp_config.get('auth', {}).get('user', '') if email_service.smtp_config else '',
                "pass": '********'  # Never return actual password
            }
        },
        "from": email_service.from_config or {},
        "recipients": {},
        "preferences": {}
    }


@router.post("/send-alert")
async def send_alert_notification(
    to_emails: List[EmailStr],
    alert_data: Dict,
    service_name: str = "Unknown Service"
):
    """
    Send alert notification email
    
    - **to_emails**: List of recipient email addresses
    - **alert_data**: Alert information (severity, message, metrics)
    - **service_name**: Name of the service
    """
    try:
        if not email_service.smtp_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email notifications not configured"
            )
        
        success = email_service.send_alert_email(
            to_emails=to_emails,
            alert_data=alert_data,
            service_name=service_name
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send alert email"
            )
        
        return {
            "success": True,
            "message": f"Alert email sent to {len(to_emails)} recipients"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send alert email: {str(e)}"
        )
