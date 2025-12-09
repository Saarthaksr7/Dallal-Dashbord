from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_session
from app.models.key import Key
from app.services.crypto import crypto_service
from app.api.deps import get_current_user

router = APIRouter()

class KeyCreate(BaseModel):
    name: str
    type: str # 'ssh_password', 'ssh_key', 'api_token'
    value: str
    description: Optional[str] = None

class KeyRead(BaseModel):
    id: int
    name: str
    type: str
    fingerprint: Optional[str] = None
    created_at: str
    description: Optional[str] = None

@router.get("/", response_model=List[KeyRead])
def list_keys(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    keys = session.exec(select(Key)).all()
    # Mask values, only return metadata
    return [
        KeyRead(
            id=k.id,
            name=k.name,
            type=k.type,
            fingerprint=k.fingerprint,
            created_at=k.created_at.isoformat(),
            description=k.description
        ) for k in keys
    ]

@router.post("/", response_model=KeyRead)
def create_key(
    key_in: KeyCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    # Encrypt the value
    encrypted = crypto_service.encrypt(key_in.value)
    
    # Generate a simple fingerprint (e.g. last 4 chars for password, or actual hash)
    if key_in.type == 'ssh_key':
        # For SSH keys, a proper fingerprint would be better, but simple hash for now
        fingerprint = f"SHA256:{hash(key_in.value)}" 
    else:
        # Mask for passwords
        fingerprint = "*" * 8
        
    db_key = Key(
        name=key_in.name,
        type=key_in.type,
        encrypted_value=encrypted,
        fingerprint=fingerprint,
        description=key_in.description
    )
    session.add(db_key)
    session.commit()
    session.refresh(db_key)
    
    return KeyRead(
        id=db_key.id,
        name=db_key.name,
        type=db_key.type,
        fingerprint=db_key.fingerprint,
        created_at=db_key.created_at.isoformat(),
        description=db_key.description
    )

@router.delete("/{key_id}")
def delete_key(
    key_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    key = session.get(Key, key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    session.delete(key)
    session.commit()
    return {"ok": True}
