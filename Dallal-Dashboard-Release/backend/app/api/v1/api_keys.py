from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime

from app.core.database import get_session
from app.models.user import User
from app.models.api_key import ApiKey
from app.api.deps import get_current_user
from app.core.security import generate_api_key, hash_api_key

router = APIRouter()

@router.get("/", response_model=List[ApiKey])
def list_keys(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    statement = select(ApiKey).where(ApiKey.user_id == current_user.id).offset(skip).limit(limit)
    return session.exec(statement).all()

@router.post("/", response_model=dict)
def create_key(
    name: str,
    scopes: str = "",
    expires_in_days: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new API Key.
    Returns the raw key ONLY ONCE.
    """
    raw_key = generate_api_key()
    hashed = hash_api_key(raw_key)
    prefix = raw_key[:10]
    
    expires_at = None
    if expires_in_days:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    
    api_key = ApiKey(
        user_id=current_user.id,
        key_hash=hashed,
        key_prefix=prefix,
        name=name,
        scopes=scopes,
        expires_at=expires_at
    )
    session.add(api_key)
    session.commit()
    session.refresh(api_key)
    
    return {
        "id": api_key.id,
        "name": api_key.name,
        "key": raw_key, # Return raw key only now
        "prefix": prefix,
        "created_at": api_key.created_at,
        "expires_at": api_key.expires_at,
        "scopes": api_key.scopes
    }

@router.delete("/{key_id}")
def revoke_key(
    key_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    key = session.get(ApiKey, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    if key.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    session.delete(key)
    session.commit()
    return {"message": "Key revoked"}
