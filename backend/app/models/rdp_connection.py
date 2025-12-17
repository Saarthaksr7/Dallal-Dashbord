from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class RDPConnectionProfile(SQLModel, table=True):
    """RDP Connection Profile model for saved connection configurations"""
    __tablename__ = "rdp_connection_profile"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Connection Details
    name: str = Field(index=True)  # User-friendly name for the connection
    hostname: str  # Can be hostname or IP
    ip_address: Optional[str] = None  # Resolved IP address
    port: int = 3389
    username: str
    password_encrypted: Optional[str] = None  # Encrypted password
    domain: Optional[str] = None
    
    # Display Settings
    os_icon: str = "windows"  # windows, linux, macos, custom
    resolution: str = "1920x1080"
    color_depth: int = 24
    
    # Reachability
    is_online: Optional[bool] = None
    last_online_check: Optional[datetime] = None
    
    # Thumbnails
    thumbnail_path: Optional[str] = None  # Path to last screenshot
    
    # Metadata
    description: Optional[str] = None
    tags: Optional[str] = None  # Comma-separated tags
    favorite: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_connected_at: Optional[datetime] = None
