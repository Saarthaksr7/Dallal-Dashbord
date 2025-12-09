from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select, delete
from typing import List, Dict, Any
import json
from datetime import datetime

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.service import Service
from app.models.key import Key
from app.models.webhook import Webhook
from app.models.settings import Setting
from app.models.user import User

router = APIRouter()

@router.get("/export", response_model=Dict[str, Any])
def export_configuration(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Export all configuration (Services, Keys, Webhooks, Settings, Users) to JSON.
    Sensitive data is exported in its encrypted form.
    """
    data = {
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "services": [s.dict() for s in session.exec(select(Service)).all()],
        "keys": [k.dict() for k in session.exec(select(Key)).all()],
        "webhooks": [w.dict() for w in session.exec(select(Webhook)).all()],
        "settings": [s.dict() for s in session.exec(select(Setting)).all()],
        "users": [u.dict() for u in session.exec(select(User)).all()]
    }
    return data

@router.post("/import")
async def import_configuration(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Restore configuration from JSON file.
    WARNING: This wipes existing configuration (Services, Keys, Webhooks, Settings).
    Users are merged or overwritten based on username?
    Actually, to be safe, we will wipe Services, Keys, Webhooks. 
    Settings check if exist.
    Users: we might overwrite 'admin' if present.
    """
    try:
        content = await file.read()
        data = json.loads(content)
        
        if data.get("version") != "1.0":
            raise HTTPException(status_code=400, detail="Unsupported backup version")

        # 1. Clear existing data (except Users for safety? No, full restore implies state reset)
        # But we must ensure the current user doesn't delete themselves and break the connection?
        # Actually session/token survives DB changes until validation.
        # Let's be aggressive: delete all configuration.
        
        session.exec(delete(Service))
        session.exec(delete(Key))
        session.exec(delete(Webhook))
        session.exec(delete(Setting))
        # session.exec(delete(User)) # Keep users for now to avoid locking out, or just handle collisions
        
        # 2. Import Services
        for item in data.get("services", []):
            session.add(Service(**item))
            
        # 3. Import Keys
        for item in data.get("keys", []):
            session.add(Key(**item))
            
        # 4. Import Webhooks
        for item in data.get("webhooks", []):
            session.add(Webhook(**item))
            
        # 5. Import Settings
        for item in data.get("settings", []):
            session.add(Setting(**item))
            
        # 6. Import Users (Upsert)
        # for item in data.get("users", []):
             # handle user import if needed
             # db_user = session.get(User, item['id']) ...
        
        session.commit()
        return {"status": "success", "message": "Configuration restored successfully"}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
