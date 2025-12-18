"""
Standardized error responses for API consistency
"""
from typing import Optional, Any, Dict
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str
    message: str
    details: Optional[Any] = None
    path: Optional[str] = None
    timestamp: Optional[str] = None
    request_id: Optional[str] = None

class ErrorHandler:
    """Centralized error handling"""
    
    @staticmethod
    def format_error(
        error_type: str,
        message: str,
        details: Optional[Any] = None,
        path: Optional[str] = None
    ) -> Dict:
        """Format error response"""
        from datetime import datetime
        
        return {
            "error": error_type,
            "message": message,
            "details": details,
            "path": path,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    @staticmethod
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTPException"""
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorHandler.format_error(
                error_type="HTTPException",
                message=exc.detail,
                path=str(request.url.path)
            )
        )
    
    @staticmethod
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors"""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorHandler.format_error(
                error_type="ValidationError",
                message="Request validation failed",
                details=exc.errors(),
                path=str(request.url.path)
            )
        )
    
    @staticmethod
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions"""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        # Don't expose internal errors in production
        message = "Internal server error"
        details = None
        
        if logger.level <= logging.DEBUG:
            message = str(exc)
            details = {"type": type(exc).__name__}
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorHandler.format_error(
                error_type="InternalServerError",
                message=message,
                details=details,
                path=str(request.url.path)
            )
        )

# Common error responses
def not_found_error(resource: str, id: Any = None):
    """Standard 404 error"""
    message = f"{resource} not found"
    if id:
        message += f" (ID: {id})"
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=message
    )

def unauthorized_error(message: str = "Authentication required"):
    """Standard 401 error"""
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"}
    )

def forbidden_error(message: str = "Access denied"):
    """Standard 403 error"""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message
    )

def bad_request_error(message: str):
    """Standard 400 error"""
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )

def conflict_error(message: str):
    """Standard 409 error"""
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message
    )

# Add to main.py:
"""
from app.core.error_handler import ErrorHandler
from fastapi.exceptions import RequestValidationError

# Replace existing exception handlers
app.add_exception_handler(HTTPException, ErrorHandler.http_exception_handler)
app.add_exception_handler(RequestValidationError, ErrorHandler.validation_exception_handler)
app.add_exception_handler(Exception, ErrorHandler.general_exception_handler)
"""
