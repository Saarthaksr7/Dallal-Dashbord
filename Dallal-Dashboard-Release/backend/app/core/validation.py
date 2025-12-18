"""
Request validation middleware and utilities
Sanitizes and validates all incoming requests
"""
from fastapi import Request, HTTPException, status
from typing import Any, Dict
import re
import html
from functools import wraps

# Blocked patterns for XSS prevention
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'onerror\s*=',
    r'onload\s*=',
    r'onclick\s*=',
    r'<iframe',
    r'<object',
    r'<embed',
]

# SQL injection patterns
SQL_PATTERNS = [
    r'(\bUNION\b.*\bSELECT\b)',
    r'(\bSELECT\b.*\bFROM\b)',
    r'(;\s*DROP\s+TABLE)',
    r'(;\s*DELETE\s+FROM)',
    r'(;\s*UPDATE\s+)',
    r'(--)',
    r'(/\*.*\*/)',
]

def sanitize_string(value: str) -> str:
    """
    Sanitize string input to prevent XSS
    
    Args:
        value: String to sanitize
        
    Returns:
        Sanitized string with HTML entities escaped
    """
    if not isinstance(value, str):
        return value
    
    # Escape HTML entities
    sanitized = html.escape(value)
    
    # Check for XSS patterns
    for pattern in XSS_PATTERNS:
        if re.search(pattern, sanitized, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input: Potential XSS detected"
            )
    
    # Check for SQL injection patterns
    for pattern in SQL_PATTERNS:
        if re.search(pattern, sanitized, re.IGNORECASE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input: Potential SQL injection detected"
            )
    
    return sanitized

def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively sanitize dictionary values
    
    Args:
        data: Dictionary to sanitize
        
    Returns:
        Sanitized dictionary
    """
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_string(item) if isinstance(item, str) 
                else sanitize_dict(item) if isinstance(item, dict)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username(username: str) -> bool:
    """
    Validate username format
    - 3-32 characters
    - Alphanumeric, underscore, hyphen only
    """
    pattern = r'^[a-zA-Z0-9_-]{3,32}$'
    return bool(re.match(pattern, username))

def validate_ip_address(ip: str) -> bool:
    """Validate IPv4 address format"""
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if not re.match(pattern, ip):
        return False
    
    # Check each octet is 0-255
    octets = ip.split('.')
    return all(0 <= int(octet) <= 255 for octet in octets)

def validate_port(port: int) -> bool:
    """Validate port number (1-65535)"""
    return 1 <= port <= 65535

def validate_url(url: str) -> bool:
    """Validate URL format"""
    pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    return bool(re.match(pattern, url))

class InputValidator:
    """
    Validation decorator for API endpoints
    
    Usage:
        @router.post("/users")
        @InputValidator.validate_body({
            "username": {"type": str, "required": True, "min_length": 3},
            "email": {"type": str, "required": True, "validator": validate_email},
            "age": {"type": int, "required": False, "min": 0, "max": 150}
        })
        async def create_user(data: dict):
            pass
    """
    
    @staticmethod
    def validate_body(schema: Dict[str, Dict[str, Any]]):
        """Validate request body against schema"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Find Request object in args
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                
                if not request:
                    # Try to get from kwargs
                    request = kwargs.get('request')
                
                if request:
                    try:
                        body = await request.json()
                    except:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid JSON body"
                        )
                    
                    # Sanitize the body
                    body = sanitize_dict(body)
                    
                    # Validate against schema
                    for field, rules in schema.items():
                        value = body.get(field)
                        
                        # Check required fields
                        if rules.get('required', False) and value is None:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Required field missing: {field}"
                            )
                        
                        if value is not None:
                            # Type checking
                            expected_type = rules.get('type')
                            if expected_type and not isinstance(value, expected_type):
                                raise HTTPException(
                                    status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"Invalid type for {field}: expected {expected_type.__name__}"
                                )
                            
                            # String length validation
                            if isinstance(value, str):
                                min_len = rules.get('min_length')
                                max_len = rules.get('max_length')
                                
                                if min_len and len(value) < min_len:
                                    raise HTTPException(
                                        status_code=status.HTTP_400_BAD_REQUEST,
                                        detail=f"{field} must be at least {min_len} characters"
                                    )
                                
                                if max_len and len(value) > max_len:
                                    raise HTTPException(
                                        status_code=status.HTTP_400_BAD_REQUEST,
                                        detail=f"{field} must be at most {max_len} characters"
                                    )
                            
                            # Numeric range validation
                            if isinstance(value, (int, float)):
                                min_val = rules.get('min')
                                max_val = rules.get('max')
                                
                                if min_val is not None and value < min_val:
                                    raise HTTPException(
                                        status_code=status.HTTP_400_BAD_REQUEST,
                                        detail=f"{field} must be at least {min_val}"
                                    )
                                
                                if max_val is not None and value > max_val:
                                    raise HTTPException(
                                        status_code=status.HTTP_400_BAD_REQUEST,
                                        detail=f"{field} must be at most {max_val}"
                                    )
                            
                            # Custom validator function
                            validator = rules.get('validator')
                            if validator and not validator(value):
                                raise HTTPException(
                                    status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"Invalid value for {field}"
                                )
                    
                    # Store sanitized body back in request
                    request._body = body
                
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator

# Middleware to sanitize query parameters
async def sanitize_query_params_middleware(request: Request, call_next):
    """Middleware to sanitize query parameters"""
    if request.query_params:
        sanitized_params = {}
        for key, value in request.query_params.items():
            sanitized_params[key] = sanitize_string(value)
        
        # Update query params (this is a simplified approach)
        request._query_params = sanitized_params
    
    response = await call_next(request)
    return response
