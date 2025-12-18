from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core import security
from app.core.database import get_session
from app.core.config import settings
from app.models.user import User
from app.api import deps
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("/login/access-token", response_model=dict)
@limiter.limit("5/minute")
def login_access_token(
    request: Request,
    session: Session = Depends(get_session), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = session.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Audit Log
    from app.services.audit import log_audit
    log_audit(username=user.username, action="LOGIN", details="User logged in via API")
    
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": user.role,
    }

@router.post("/signup", response_model=User)
def create_user(user_in: User, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user_in.hashed_password = security.get_password_hash(user_in.hashed_password)
    session.add(user_in)
    session.commit()
    session.refresh(user_in)
    return user_in

@router.post("/login/test-token", response_model=User)
def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user

@router.patch("/users/me/preferences")
def update_user_preferences(
    preferences: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Update user preferences
    """
    # Ensure it's a dict, though type hint handles it mostly
    current_user.preferences = preferences
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(current_user, "preferences")
    session.add(current_user)
    session.commit()
    return {"status": "success", "preferences": preferences}

@router.get("/auth/master-key", response_model=dict)
def get_master_key(
    current_user: User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Get the master encryption key (Superuser only).
    """
    from app.core.security import key
    return {"key": key.decode()}
