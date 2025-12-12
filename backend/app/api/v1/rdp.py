from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.rdp_session import RDPSession, RDPRecording
from app.core.security import encrypt_password, decrypt_password
from pydantic import BaseModel

router = APIRouter()

# ===========================
# Pydantic Schemas
# ===========================

class RDPSessionCreate(BaseModel):
    service_id: int | None = None
    host: str
    port: int = 3389
    username: str
    password: str
    domain: str | None = None
    session_name: str
    protocol: str = "rdp"
    resolution: str = "1920x1080"
    color_depth: int = 24
    recording_enabled: bool = False


class RDPSessionUpdate(BaseModel):
    session_name: str | None = None
    status: str | None = None
    resolution: str | None = None
    recording_enabled: bool | None = None


class RDPConnectionRequest(BaseModel):
    action: str  # "connect" or "disconnect"


# ===========================
# Session Endpoints
# ===========================

@router.post("/sessions", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_rdp_session(
    session_data: RDPSessionCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new RDP session"""
    
    # Encrypt the password before storing
    encrypted_password = encrypt_password(session_data.password)
    
    # Create session
    rdp_session = RDPSession(
        user_id=current_user.id,
        service_id=session_data.service_id,
        host=session_data.host,
        port=session_data.port,
        username=session_data.username,
        password_encrypted=encrypted_password,
        domain=session_data.domain,
        session_name=session_data.session_name,
        protocol=session_data.protocol,
        resolution=session_data.resolution,
        color_depth=session_data.color_depth,
        recording_enabled=session_data.recording_enabled,
        status="disconnected"
    )
    
    db.add(rdp_session)
    db.commit()
    db.refresh(rdp_session)
    
    # Don't return the encrypted password
    return {
        "id": rdp_session.id,
        "session_name": rdp_session.session_name,
        "host": rdp_session.host,
        "port": rdp_session.port,
        "username": rdp_session.username,
        "domain": rdp_session.domain,
        "status": rdp_session.status,
        "resolution": rdp_session.resolution,
        "recording_enabled": rdp_session.recording_enabled,
        "created_at": rdp_session.created_at
    }


@router.get("/sessions", response_model=List[dict])
async def list_rdp_sessions(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """List all RDP sessions for the current user"""
    
    statement = select(RDPSession).where(
        RDPSession.user_id == current_user.id
    ).offset(skip).limit(limit).order_by(RDPSession.created_at.desc())
    
    sessions = db.exec(statement).all()
    
    return [
        {
            "id": s.id,
            "session_name": s.session_name,
            "host": s.host,
            "port": s.port,
            "username": s.username,
            "domain": s.domain,
            "status": s.status,
            "resolution": s.resolution,
            "recording_enabled": s.recording_enabled,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
            "duration_seconds": s.duration_seconds,
            "created_at": s.created_at,
            "last_error": s.last_error
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=dict)
async def get_rdp_session(
    session_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific RDP session"""
    
    statement = select(RDPSession).where(
        RDPSession.id == session_id,
        RDPSession.user_id == current_user.id
    )
    session = db.exec(statement).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "session_name": session.session_name,
        "host": session.host,
        "port": session.port,
        "username": session.username,
        "domain": session.domain,
        "status": session.status,
        "protocol": session.protocol,
        "resolution": session.resolution,
        "color_depth": session.color_depth,
        "recording_enabled": session.recording_enabled,
        "recording_name": session.recording_name,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "duration_seconds": session.duration_seconds,
        "bandwidth_mbps": session.bandwidth_mbps,
        "latency_ms": session.latency_ms,
        "last_error": session.last_error,
        "error_count": session.error_count,
        "created_at": session.created_at,
        "updated_at": session.updated_at
    }


@router.put("/sessions/{session_id}", response_model=dict)
async def update_rdp_session(
    session_id: int,
    update_data: RDPSessionUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an RDP session"""
    
    statement = select(RDPSession).where(
        RDPSession.id == session_id,
        RDPSession.user_id == current_user.id
    )
    session = db.exec(statement).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update fields
    if update_data.session_name is not None:
        session.session_name = update_data.session_name
    if update_data.status is not None:
        session.status = update_data.status
    if update_data.resolution is not None:
        session.resolution = update_data.resolution
    if update_data.recording_enabled is not None:
        session.recording_enabled = update_data.recording_enabled
    
    session.updated_at = datetime.utcnow()
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"message": "Session updated successfully", "id": session.id}


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rdp_session(
    session_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an RDP session"""
    
    statement = select(RDPSession).where(
        RDPSession.id == session_id,
        RDPSession.user_id == current_user.id
    )
    session = db.exec(statement).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Don't allow deleting active sessions
    if session.status == "connected":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an active session. Disconnect first."
        )
    
    db.delete(session)
    db.commit()
    return None


@router.post("/sessions/{session_id}/connect", response_model=dict)
async def connect_rdp_session(
    session_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Initiate RDP connection"""
    
    statement = select(RDPSession).where(
        RDPSession.id == session_id,
        RDPSession.user_id == current_user.id
    )
    session = db.exec(statement).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status == "connected":
        raise HTTPException(status_code=400, detail="Session already connected")
    
    # Update session status
    session.status = "connecting"
    session.started_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()
    
    db.add(session)
    db.commit()
    
    # In a real implementation, this would:
    # 1. Decrypt the password
    # 2. Establish RDP connection
    # 3. Return connection details or WebSocket URL
    
    return {
        "message": "Connection initiated",
        "session_id": session.id,
        "status": session.status,
        "connection_url": f"rdp://{session.host}:{session.port}"
    }


@router.post("/sessions/{session_id}/disconnect", response_model=dict)
async def disconnect_rdp_session(
    session_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Disconnect RDP session"""
    
    statement = select(RDPSession).where(
        RDPSession.id == session_id,
        RDPSession.user_id == current_user.id
    )
    session = db.exec(statement).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "connected":
        raise HTTPException(status_code=400, detail="Session not connected")
    
    # Calculate duration
    if session.started_at:
        session.duration_seconds = int((datetime.utcnow() - session.started_at).total_seconds())
    
    session.status = "disconnected"
    session.ended_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()
    
    db.add(session)
    db.commit()
    
    return {
        "message": "Session disconnected",
        "duration_seconds": session.duration_seconds
    }


# ===========================
# Recording Endpoints
# ===========================

@router.get("/recordings", response_model=List[dict])
async def list_rdp_recordings(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """List all RDP recordings for the current user"""
    
    statement = select(RDPRecording).where(
        RDPRecording.user_id == current_user.id
    ).offset(skip).limit(limit).order_by(RDPRecording.recorded_at.desc())
    
    recordings = db.exec(statement).all()
    
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "name": r.name,
            "file_size_mb": r.file_size_mb,
            "duration_seconds": r.duration_seconds,
            "format": r.format,
            "resolution": r.resolution,
            "fps": r.fps,
            "recorded_at": r.recorded_at
        }
        for r in recordings
    ]


@router.get("/recordings/{recording_id}", response_model=dict)
async def get_rdp_recording(
    recording_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get recording details"""
    
    statement = select(RDPRecording).where(
        RDPRecording.id == recording_id,
        RDPRecording.user_id == current_user.id
    )
    recording = db.exec(statement).first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    return {
        "id": recording.id,
        "session_id": recording.session_id,
        "name": recording.name,
        "file_path": recording.file_path,
        "file_size_mb": recording.file_size_mb,
        "duration_seconds": recording.duration_seconds,
        "format": recording.format,
        "resolution": recording.resolution,
        "fps": recording.fps,
        "codec": recording.codec,
        "recorded_at": recording.recorded_at
    }


@router.delete("/recordings/{recording_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rdp_recording(
    recording_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a recording"""
    
    statement = select(RDPRecording).where(
        RDPRecording.id == recording_id,
        RDPRecording.user_id == current_user.id
    )
    recording = db.exec(statement).first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # In a real implementation, also delete the file
    # os.remove(recording.file_path)
    
    db.delete(recording)
    db.commit()
    return None
