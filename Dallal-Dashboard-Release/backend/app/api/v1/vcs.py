from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.vcs import vcs_service
from app.api import deps
from app.models.user import User

router = APIRouter()

class VcsConfig(BaseModel):
    remote_url: str

class SyncRequest(BaseModel):
    message: str = "Auto-sync from Dashboard"
    push: bool = False

@router.get("/status")
def get_vcs_status(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get current git status
    """
    return vcs_service.get_status()

@router.post("/export")
def export_data(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Export database data to JSON files
    """
    try:
        vcs_service.export_data()
        return {"status": "success", "detail": "Data exported successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
def sync_repo(
    request: SyncRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Export -> Commit -> (Optional) Push
    """
    try:
        # 1. Export
        vcs_service.export_data()
        
        # 2. Commit
        commit_res = vcs_service.commit(request.message)
        
        # 3. Push
        push_res = None
        if request.push:
            push_res = vcs_service.push()
            
        return {
            "status": "success", 
            "commit": commit_res, 
            "push": push_res,
            "detail": "Sync completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/config")
def configure_vcs(
    config: VcsConfig,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Set remote URL
    """
    try:
        vcs_service.set_remote(config.remote_url)
        return {"status": "success", "detail": "Remote configured"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
