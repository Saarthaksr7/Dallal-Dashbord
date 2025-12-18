from typing import Optional
from sqlmodel import SQLModel
from datetime import datetime
from pydantic import field_validator

class ServiceUpdate(SQLModel):
    name: Optional[str] = None
    ip: Optional[str] = None
    hostname: Optional[str] = None
    port: Optional[int] = None
    mac_address: Optional[str] = None
    vendor: Optional[str] = None
    group: Optional[str] = None
    tags: Optional[str] = None
    
    ssh_username: Optional[str] = None
    ssh_password: Optional[str] = None
    
    check_type: Optional[str] = None
    check_target: Optional[str] = None
    script_content: Optional[str] = None
    expected_response: Optional[str] = None
    check_interval: Optional[int] = None
    
    snmp_community: Optional[str] = None
    snmp_port: Optional[int] = None
    sys_descr: Optional[str] = None
    
    is_active: Optional[bool] = None
    maintenance: Optional[bool] = None
    enabled: Optional[bool] = None
    
    last_checked: Optional[datetime] = None
    response_time_ms: Optional[int] = None
    drift_detected: Optional[bool] = None
    
    cpu_usage: Optional[float] = None
    ram_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    
    auto_restart: Optional[bool] = None
    restart_command: Optional[str] = None
    last_healed: Optional[datetime] = None
    
    # Validators to handle empty strings
    @field_validator('port', 'check_interval', 'snmp_port', 'response_time_ms', mode='before')
    @classmethod
    def empty_str_to_none_int(cls, v):
        if v == '' or v is None:
            return None
        return v
    
    @field_validator('cpu_usage', 'ram_usage', 'disk_usage', mode='before')
    @classmethod
    def empty_str_to_none_float(cls, v):
        if v == '' or v is None:
            return None
        return v
