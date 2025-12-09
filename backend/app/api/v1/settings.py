from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from sqlmodel import Session, select
from pydantic import BaseModel
from app.core.database import get_session
from app.models.settings import Setting

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

@router.get("/", response_model=List[Setting])
def read_settings(category: str = None, session: Session = Depends(get_session)):
    query = select(Setting)
    if category:
        query = query.where(Setting.category == category)
    return session.exec(query).all()

@router.put("/{key}", response_model=Setting)
def update_setting(key: str, update: SettingUpdate, session: Session = Depends(get_session)):
    setting = session.get(Setting, key)
    if not setting:
        # Auto-create if not exists for flexibility
        setting = Setting(key=key, value=update.value)
    else:
        setting.value = update.value
    
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting

@router.post("/batch", response_model=List[Setting])
def update_batch(settings: List[Setting], session: Session = Depends(get_session)):
    updated = []
    for s in settings:
        existing = session.get(Setting, s.key)
        if existing:
            existing.value = s.value
            existing.category = s.category
            existing.description = s.description
            session.add(existing)
            updated.append(existing)
        else:
            session.add(s)
            updated.append(s)
    session.commit()
    return updated

@router.get("/backup/export")
def export_backup(session: Session = Depends(get_session)):
    from app.models.service import Service
    from app.models.settings import Setting
    
    services = session.exec(select(Service)).all()
    settings = session.exec(select(Setting)).all()
    
    return {
        "timestamp": "now", # TODO: format
        "version": "2.0",
        "services": [s.dict() for s in services],
        "settings": [s.dict() for s in settings]
    }
