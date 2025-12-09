from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, desc
from typing import List, Optional
from app.core.database import get_session
from app.models.audit import AuditLog
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AuditLog])
def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: Optional[str] = None,
    username: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    query = select(AuditLog).order_by(desc(AuditLog.timestamp))
    
    if action:
        query = query.where(AuditLog.action == action)
    if username:
        query = query.where(AuditLog.username == username)
        
    query = query.offset(offset).limit(limit)
    return session.exec(query).all()
