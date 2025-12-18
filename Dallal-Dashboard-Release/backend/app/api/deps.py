from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel, ValidationError
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.config import settings
from app.models.user import User

from app.models.api_key import ApiKey
from app.core.security import hash_api_key
from fastapi.security import APIKeyHeader
from datetime import datetime

# OAuth2 (Bearer)
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False
)

# API Key Header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

class TokenPayload(BaseModel):
    sub: Optional[str] = None

def get_current_user(
    session: Session = Depends(get_session),
    token: Optional[str] = Depends(reusable_oauth2),
    api_key_raw: Optional[str] = Depends(api_key_header)
) -> User:
    # 1. Try API Key first (common for scripts)
    if api_key_raw:
        hashed = hash_api_key(api_key_raw)
        statement = select(ApiKey).where(ApiKey.key_hash == hashed)
        api_key_obj = session.exec(statement).first()
        
        if api_key_obj:
            # Check expiry
            if api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
                 raise HTTPException(status_code=403, detail="API Key expired")
            
            # Update last used
            api_key_obj.last_used = datetime.utcnow()
            session.add(api_key_obj)
            session.commit()
            
            # Return associated user
            user = session.get(User, api_key_obj.user_id)
            if user:
                return user
    
    # 2. Try Bearer Token
    if token:
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_data = TokenPayload(**payload)
        except (JWTError, ValidationError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
        user = session.get(User, int(token_data.sub))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
        
    # 3. Neither provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user and verify they are an active superuser."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
