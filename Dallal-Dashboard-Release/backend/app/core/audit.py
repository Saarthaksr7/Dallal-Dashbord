"""
Audit logging for sensitive operations
"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger("audit")

class AuditAction(Enum):
    """Audit action types"""
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"
    
    # User Management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    PASSWORD_CHANGED = "password_changed"
    
    # Service Management
    SERVICE_CREATED = "service_created"
    SERVICE_UPDATED = "service_updated"
    SERVICE_DELETED = "service_deleted"
    SERVICE_STARTED = "service_started"
    SERVICE_STOPPED = "service_stopped"
    
    # Docker Operations
    CONTAINER_STARTED = "container_started"
    CONTAINER_STOPPED = "container_stopped"
    CONTAINER_REMOVED = "container_removed"
    
    # SSH/RDP
    SSH_CONNECTION = "ssh_connection"
    SSH_DISCONNECTION = "ssh_disconnection"
    RDP_CONNECTION = "rdp_connection"
    RDP_DISCONNECTION = "rdp_disconnection"
    
    # Configuration
    SETTINGS_UPDATED = "settings_updated"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"
    
    # Security
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    API_KEY_CREATED = "api_key_created"
    API_KEY_REVOKED = "api_key_revoked"

class AuditLogger:
    """Centralized audit logging"""
    
    @staticmethod
    def log(
        action: AuditAction,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True
    ):
        """
        Log an audit event
        
        Args:
            action: Type of action performed
            user_id: ID of user who performed action
            username: Username of user
            resource_type: Type of resource affected (service, container, etc.)
            resource_id: ID of affected resource
            details: Additional context
            ip_address: IP address of request
            user_agent: User agent string
            success: Whether action succeeded
        """
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action.value,
            "user_id": user_id,
            "username": username,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "success": success,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details or {}
        }
        
        # Log to audit logger
        logger.info(audit_entry)
        
        # TODO: Also write to database or separate audit log file
        # Example: AuditLog.create(**audit_entry)
        
        return audit_entry
    
    @staticmethod
    def log_login(username: str, success: bool, ip_address: str = None, reason: str = None):
        """Log login attempt"""
        details = {}
        if reason:
            details["reason"] = reason
        
        return AuditLogger.log(
            action=AuditAction.LOGIN_SUCCESS if success else AuditAction.LOGIN_FAILED,
            username=username,
            ip_address=ip_address,
            details=details,
            success=success
        )
    
    @staticmethod
    def log_service_operation(operation: str, service_id: str, user_id: int, username: str):
        """Log service operation"""
        action_map = {
            "create": AuditAction.SERVICE_CREATED,
            "update": AuditAction.SERVICE_UPDATED,
            "delete": AuditAction.SERVICE_DELETED,
            "start": AuditAction.SERVICE_STARTED,
            "stop": AuditAction.SERVICE_STOPPED
        }
        
        return AuditLogger.log(
            action=action_map.get(operation, AuditAction.SERVICE_UPDATED),
            user_id=user_id,
            username=username,
            resource_type="service",
            resource_id=service_id
        )
    
    @staticmethod
    def log_docker_operation(operation: str, container_id: str, user_id: int, username: str):
        """Log Docker container operation"""
        action_map = {
            "start": AuditAction.CONTAINER_STARTED,
            "stop": AuditAction.CONTAINER_STOPPED,
            "remove": AuditAction.CONTAINER_REMOVED
        }
        
        return AuditLogger.log(
            action=action_map.get(operation, AuditAction.CONTAINER_STARTED),
            user_id=user_id,
            username=username,
            resource_type="container",
            resource_id=container_id
        )
    
    @staticmethod
    def log_ssh_connection(user_id: int, username: str, host: str, connected: bool):
        """Log SSH connection/disconnection"""
        return AuditLogger.log(
            action=AuditAction.SSH_CONNECTION if connected else AuditAction.SSH_DISCONNECTION,
            user_id=user_id,
            username=username,
            details={"host": host}
        )

# Usage in endpoints:
"""
from app.core.audit import AuditLogger, AuditAction

@router.post("/login")
async def login(username: str, password: str, request: Request):
    user = authenticate(username, password)
    
    if user:
        # Log successful login
        AuditLogger.log_login(
            username=username,
            success=True,
            ip_address=request.client.host
        )
        return create_tokens(user)
    else:
        # Log failed login
        AuditLogger.log_login(
            username=username,
            success=False,
            ip_address=request.client.host,
            reason="Invalid credentials"
        )
        raise HTTPException(401)

@router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User):
    # Delete service...
    
    # Log the action
    AuditLogger.log_service_operation(
        operation="delete",
        service_id=service_id,
        user_id=current_user.id,
        username=current_user.username
    )
    
    return {"message": "Service deleted"}
"""
