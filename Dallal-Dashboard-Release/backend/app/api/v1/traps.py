from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, desc
from typing import List, Optional
from app.core.database import get_session
from app.models.snmp_trap import SnmpTrap

router = APIRouter()

@router.get("/", response_model=List[SnmpTrap])
def get_traps(
    service_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session)
):
    query = select(SnmpTrap).order_by(desc(SnmpTrap.timestamp))
    
    if service_id:
        query = query.where(SnmpTrap.service_id == service_id)
        
    query = query.limit(limit).offset(offset)
    return session.exec(query).all()
