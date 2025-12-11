"""
Refresh token implementation for enhanced security
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings
from fastapi import HTTPException, status

class RefreshTokenManager:
    """Manage refresh tokens for long-lived sessions"""
    
    # In-memory store (use Redis in production)
    refresh_tokens = {}
    
    @staticmethod
    def create_tokens(user_id: int) -> dict:
        """
        Create access and refresh tokens
        
        Returns:
            {
                "access_token": str,
                "refresh_token": str,
                "token_type": "bearer",
                "expires_in": int
            }
        """
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = RefreshTokenManager._create_access_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        
        # Create refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = RefreshTokenManager._create_refresh_token(
            data={"sub": str(user_id)},
            expires_delta=refresh_token_expires
        )
        
        # Store refresh token
        RefreshTokenManager.refresh_tokens[refresh_token] = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + refresh_token_expires
        }
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    @staticmethod
    def _create_access_token(data: dict, expires_delta: timedelta) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire, "type": "access"})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def _create_refresh_token(data: dict, expires_delta: timedelta) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire, "type": "refresh"})
        
        # Use different secret for refresh tokens
        secret_key = settings.REFRESH_SECRET_KEY or settings.SECRET_KEY
        encoded_jwt = jwt.encode(
            to_encode,
            secret_key,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        """
        Create new access token from refresh token
        
        Raises:
            HTTPException: If refresh token is invalid or expired
        """
        # Verify refresh token exists
        if refresh_token not in RefreshTokenManager.refresh_tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if expired
        token_data = RefreshTokenManager.refresh_tokens[refresh_token]
        if datetime.now() > token_data["expires_at"]:
            # Clean up expired token
            del RefreshTokenManager.refresh_tokens[refresh_token]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired"
            )
        
        # Verify JWT
        try:
            secret_key = settings.REFRESH_SECRET_KEY or settings.SECRET_KEY
            payload = jwt.decode(
                refresh_token,
                secret_key,
                algorithms=[settings.ALGORITHM]
            )
            
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = int(payload.get("sub"))
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate refresh token"
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = RefreshTokenManager._create_access_token(
            data={"sub": str(user_id)},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    @staticmethod
    def revoke_refresh_token(refresh_token: str) -> bool:
        """Revoke a refresh token (logout)"""
        if refresh_token in RefreshTokenManager.refresh_tokens:
            del RefreshTokenManager.refresh_tokens[refresh_token]
            return True
        return False
    
    @staticmethod
    def cleanup_expired_tokens():
        """Remove expired refresh tokens"""
        now = datetime.now()
        expired = [
            token for token, data in RefreshTokenManager.refresh_tokens.items()
            if now > data["expires_at"]
        ]
        
        for token in expired:
            del RefreshTokenManager.refresh_tokens[token]
        
        return len(expired)

# Example usage in auth endpoint:
"""
from app.core.refresh_token import RefreshTokenManager

@router.post("/login")
async def login(username: str, password: str):
    # Verify credentials...
    user = authenticate_user(username, password)
    
    # Create tokens
    tokens = RefreshTokenManager.create_tokens(user.id)
    
    return tokens

@router.post("/refresh")
async def refresh(refresh_token: str):
    # Get new access token
    tokens = RefreshTokenManager.refresh_access_token(refresh_token)
    
    return tokens

@router.post("/logout")
async def logout(refresh_token: str):
    # Revoke refresh token
    RefreshTokenManager.revoke_refresh_token(refresh_token)
    
    return {"message": "Logged out successfully"}
"""
