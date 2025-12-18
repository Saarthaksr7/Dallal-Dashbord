from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from fastapi.responses import Response
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.core.database import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.rdp_session import RDPSession, RDPRecording
from app.models.rdp_connection import RDPConnectionProfile
from app.core.security import encrypt_password, decrypt_password
from app.services.rdp_connection_service import rdp_connection_service
from app.utils.rdp_file_generator import rdp_file_generator
from app.services.guacamole_handler import handle_guacamole_connection
from pydantic import BaseModel

router = APIRouter()

# ===========================
# Pydantic Schemas
# ===========================

# Session Schemas
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


# Connection Profile Schemas
class RDPConnectionProfileCreate(BaseModel):
    name: str
    hostname: str
    port: int = 3389
    username: str
    password: str
    domain: str | None = None
    os_icon: str = "windows"  # windows, linux, macos
    resolution: str = "1920x1080"
    color_depth: int = 24
    description: str | None = None
    tags: str | None = None
    favorite: bool = False


class RDPConnectionProfileUpdate(BaseModel):
    name: str | None = None
    hostname: str | None = None
    port: int | None = None
    username: str | None = None
    password: str | None = None
    domain: str | None = None
    os_icon: str | None = None
    resolution: str | None = None
    color_depth: int | None = None
    description: str | None = None
    tags: str | None = None
    favorite: bool | None = None


class ConnectionTestRequest(BaseModel):
    hostname: str
    port: int = 3389


class ConnectionTestResponse(BaseModel):
    is_reachable: bool
    message: str
    response_time_ms: float | None = None


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


# ===========================
# Connection Profile Endpoints
# ===========================

@router.post("/profiles", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_connection_profile(
    profile_data: RDPConnectionProfileCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new RDP connection profile"""
    
    # Validate connection parameters
    is_valid, error_msg = rdp_connection_service.validate_connection_params(
        profile_data.hostname,
        profile_data.port,
        profile_data.username
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Encrypt password
    encrypted_password = encrypt_password(profile_data.password)
    
    # Resolve hostname to IP
    ip_address = rdp_connection_service.resolve_hostname(profile_data.hostname)
    
    # Create profile
    profile = RDPConnectionProfile(
        user_id=current_user.id,
        name=profile_data.name,
        hostname=profile_data.hostname,
        ip_address=ip_address,
        port=profile_data.port,
        username=profile_data.username,
        password_encrypted=encrypted_password,
        domain=profile_data.domain,
        os_icon=profile_data.os_icon,
        resolution=profile_data.resolution,
        color_depth=profile_data.color_depth,
        description=profile_data.description,
        tags=profile_data.tags,
        favorite=profile_data.favorite
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    # Check reachability asynchronously
    is_reachable, _ = await rdp_connection_service.check_rdp_reachability_async(
        profile.hostname,
        profile.port
    )
    profile.is_online = is_reachable
    profile.last_online_check = datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return {
        "id": profile.id,
        "name": profile.name,
        "hostname": profile.hostname,
        "ip_address": profile.ip_address,
        "port": profile.port,
        "username": profile.username,
        "domain": profile.domain,
        "os_icon": profile.os_icon,
        "resolution": profile.resolution,
        "color_depth": profile.color_depth,
        "description": profile.description,
        "tags": profile.tags,
        "favorite": profile.favorite,
        "is_online": profile.is_online,
        "last_online_check": profile.last_online_check,
        "created_at": profile.created_at
    }


@router.get("/profiles", response_model=List[dict])
async def list_connection_profiles(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    favorite_only: bool = False
):
    """List all RDP connection profiles for the current user"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.user_id == current_user.id
    )
    
    if favorite_only:
        statement = statement.where(RDPConnectionProfile.favorite == True)
    
    statement = statement.offset(skip).limit(limit).order_by(
        RDPConnectionProfile.favorite.desc(),
        RDPConnectionProfile.last_connected_at.desc().nullslast(),
        RDPConnectionProfile.name
    )
    
    profiles = db.exec(statement).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "hostname": p.hostname,
            "ip_address": p.ip_address,
            "port": p.port,
            "username": p.username,
            "domain": p.domain,
            "os_icon": p.os_icon,
            "resolution": p.resolution,
            "color_depth": p.color_depth,
            "description": p.description,
            "tags": p.tags,
            "favorite": p.favorite,
            "is_online": p.is_online,
            "last_online_check": p.last_online_check,
            "thumbnail_path": p.thumbnail_path,
            "last_connected_at": p.last_connected_at,
            "created_at": p.created_at,
            "updated_at": p.updated_at
        }
        for p in profiles
    ]


@router.get("/profiles/{profile_id}", response_model=dict)
async def get_connection_profile(
    profile_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific connection profile"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "id": profile.id,
        "name": profile.name,
        "hostname": profile.hostname,
        "ip_address": profile.ip_address,
        "port": profile.port,
        "username": profile.username,
        "domain": profile.domain,
        "os_icon": profile.os_icon,
        "resolution": profile.resolution,
        "color_depth": profile.color_depth,
        "description": profile.description,
        "tags": profile.tags,
        "favorite": profile.favorite,
        "is_online": profile.is_online,
        "last_online_check": profile.last_online_check,
        "thumbnail_path": profile.thumbnail_path,
        "last_connected_at": profile.last_connected_at,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }


@router.put("/profiles/{profile_id}", response_model=dict)
async def update_connection_profile(
    profile_id: int,
    update_data: RDPConnectionProfileUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a connection profile"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update fields if provided
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Handle password encryption separately
    if "password" in update_dict:
        encrypted_password = encrypt_password(update_dict["password"])
        update_dict["password_encrypted"] = encrypted_password
        del update_dict["password"]
    
    # Update hostname resolution if hostname changed
    if "hostname" in update_dict:
        ip_address = rdp_connection_service.resolve_hostname(update_dict["hostname"])
        update_dict["ip_address"] = ip_address
    
    # Apply updates
    for key, value in update_dict.items():
        setattr(profile, key, value)
    
    profile.updated_at = datetime.utcnow()
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return {"message": "Profile updated successfully", "id": profile.id}


@router.delete("/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection_profile(
    profile_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a connection profile"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(profile)
    db.commit()
    return None


@router.get("/profiles/{profile_id}/status", response_model=dict)
async def check_profile_status(
    profile_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Check reachability status of a connection profile"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Perform reachability check
    import time
    start_time = time.time()
    
    is_reachable, error_msg = await rdp_connection_service.check_rdp_reachability_async(
        profile.hostname,
        profile.port
    )
    
    response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
    
    # Update profile status
    profile.is_online = is_reachable
    profile.last_online_check = datetime.utcnow()
    db.add(profile)
    db.commit()
    
    return {
        "profile_id": profile.id,
        "is_online": is_reachable,
        "message": "Server is reachable" if is_reachable else error_msg,
        "response_time_ms": response_time if is_reachable else None,
        "last_check": profile.last_online_check
    }


@router.post("/profiles/test-connection", response_model=ConnectionTestResponse)
async def test_connection(test_data: ConnectionTestRequest):
    """Test RDP connection without saving (for validation before creating profile)"""
    
    # Validate parameters
    is_valid, error_msg = rdp_connection_service.validate_connection_params(
        test_data.hostname,
        test_data.port,
        "test_user"  # Dummy username for validation
    )
    
    if not is_valid:
        return ConnectionTestResponse(
            is_reachable=False,
            message=error_msg,
            response_time_ms=None
        )
    
    # Perform reachability check
    import time
    start_time = time.time()
    
    is_reachable, error_msg = await rdp_connection_service.check_rdp_reachability_async(
        test_data.hostname,
        test_data.port
    )
    
    response_time = (time.time() - start_time) * 1000
    
    return ConnectionTestResponse(
        is_reachable=is_reachable,
        message="Connection successful! RDP port is accessible." if is_reachable else error_msg or "Connection failed",
        response_time_ms=response_time if is_reachable else None
    )


@router.get("/profiles/{profile_id}/download-rdp")
async def download_rdp_file(
    profile_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    include_password: bool = False  # Security: default to NOT including password
):
    """Generate and download .rdp file for a connection profile"""
    
    statement = select(RDPConnectionProfile).where(
        RDPConnectionProfile.id == profile_id,
        RDPConnectionProfile.user_id == current_user.id
    )
    profile = db.exec(statement).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Decrypt password if needed
    password = None
    if include_password and profile.password_encrypted:
        password = decrypt_password(profile.password_encrypted)
    
    # Generate .rdp file content
    rdp_content = rdp_file_generator.generate_rdp_file(
        host=profile.hostname,
        username=profile.username,
        port=profile.port,
        domain=profile.domain,
        resolution=profile.resolution,
        color_depth=profile.color_depth,
        password=password,
        include_password=include_password,
        fullscreen=False  # User can change this in the .rdp file settings
    )
    
    # Generate safe filename
    filename = rdp_file_generator.generate_filename(profile.name)
    
    # Update last connected timestamp
    profile.last_connected_at = datetime.utcnow()
    db.add(profile)
    db.commit()
    
    # Return file as downloadable attachment
    return Response(
        content=rdp_content,
        media_type="application/x-rdp",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/x-rdp"
        }
    )


# ===========================
# WebSocket Endpoint (Guacamole)
# ===========================

@router.websocket("/ws/{profile_id}")
async def rdp_websocket(
    profile_id: int,
    websocket: WebSocket,
    db: Session = Depends(get_session),
):
    """
    WebSocket endpoint for browser-based RDP connections via Guacamole.
    
    This endpoint establishes a WebSocket connection between the browser client
    and the Guacamole daemon (guacd), enabling in-browser RDP sessions.
    
    Authentication:
        Pass JWT token as query parameter: ?token=<jwt_token>
        Example: ws://localhost:8000/api/v1/rdp/ws/1?token=eyJ0eXAi...
    
    Usage:
        ws://localhost:8000/api/v1/rdp/ws/{profile_id}?token=<jwt>
    """
    # Extract token from query parameters
    query_params = dict(websocket.query_params)
    token = query_params.get('token')
    
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return
    
    # Validate JWT token
    try:
        from app.core.security import decode_token
        payload = decode_token(token)
        user_id = payload.get("sub")
 
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Get user from database
        from app.models.user import User as UserModel
        user = db.exec(select(UserModel).where(UserModel.id == int(user_id))).first()
        
        if not user:
            await websocket.close(code=1008, reason="User not found")
            return
            
    except Exception as e:
        await websocket.close(code=1008, reason=f"Authentication failed: {str(e)}")
        return
    
    # Handle the Guacamole connection with authenticated user
    await handle_guacamole_connection(
        websocket=websocket,
        profile_id=profile_id,
        db=db,
        current_user=user
    )

