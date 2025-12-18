from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class RDPSession(SQLModel, table=True):
    """RDP Session model for remote desktop management"""
    __tablename__ = "rdp_session"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    service_id: Optional[int] = Field(default=None, foreign_key="service.id")
    
    # Connection Details
    host: str
    port: int = 3389
    username: str
    password_encrypted: Optional[str] = None  # Encrypted password
    domain: Optional[str] = None
    
    # Session Info
    session_name: str
    status: str = "disconnected"  # disconnected, connecting, connected, error
    protocol: str = "rdp"  # rdp, vnc, etc.
    
    # Recording
    recording_enabled: bool = False
    recording_path: Optional[str] = None
    recording_name: Optional[str] = None
    recording_size_mb: float = 0.0
    
    # Thumbnail
    thumbnail_path: Optional[str] = None  # Path to last screenshot
    
    # Session Metadata
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    resolution: str = "1920x1080"
    color_depth: int = 24
    
    # Performance Metrics
    bandwidth_mbps: float = 0.0
    latency_ms: int = 0
    
    # Error Handling
    last_error: Optional[str] = None
    error_count: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RDPRecording(SQLModel, table=True):
    """RDP Recording metadata"""
    __tablename__ = "rdp_recording"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="rdp_session.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Recording Details
    name: str
    file_path: str
    file_size_mb: float
    duration_seconds: int
    format: str = "mp4"  # mp4, webm, etc.
    
    # Video Metadata
    resolution: str = "1920x1080"
    fps: int = 30
    codec: str = "h264"
    
    # Timestamps
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
