from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from enum import Enum

class CheckType(str, Enum):
    TCP = "tcp"
    HTTP = "http"
    ICMP = "icmp"
    SCRIPT = "script"
    SNMP = "snmp"

class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Basic Info
    name: str = Field(index=True)
    ip: str = Field(index=True)
    hostname: Optional[str] = Field(default=None)
    port: Optional[int] = Field(default=None)
    
    # Network Info
    mac_address: Optional[str] = Field(default=None)
    vendor: Optional[str] = Field(default=None)
    
    # SSH Credentials (encrypted)
    ssh_username: Optional[str] = Field(default=None)
    ssh_password: Optional[str] = Field(default=None)
    
    # Deep Status Config
    check_type: CheckType = Field(default=CheckType.TCP)
    check_target: Optional[str] = Field(default=None)  # URL path for HTTP checks
    script_content: Optional[str] = Field(default=None)  # Script for SCRIPT checks
    expected_response: Optional[str] = Field(default=None)  # Expected response content
    check_interval: int = Field(default=60)  # Seconds between checks
    
    # SNMP Settings
    snmp_community: str = Field(default="public")
    snmp_port: int = Field(default=161)
    sys_descr: Optional[str] = Field(default=None)  # SNMP system description
    
    # State
    is_active: bool = Field(default=False)
    maintenance: bool = Field(default=False)  # Maintenance mode flag
    enabled: bool = Field(default=True)  # Monitoring enabled/disabled
    last_checked: Optional[datetime] = None
    response_time_ms: Optional[int] = None
    drift_detected: bool = Field(default=False)  # Response drift detection

    # Agentless Stats
    cpu_usage: Optional[float] = Field(default=None, description="CPU Usage %")
    ram_usage: Optional[float] = Field(default=None, description="RAM Usage %")
    disk_usage: Optional[float] = Field(default=None, description="Disk Usage %")
    
    # Auto-Healing
    auto_restart: bool = Field(default=False)
    restart_command: Optional[str] = Field(default=None)
    last_healed: Optional[datetime] = None

