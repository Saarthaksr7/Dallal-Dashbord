from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class SnmpTrap(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: Optional[int] = Field(default=None, foreign_key="service.id", index=True)
    source_ip: str = Field(index=True)
    oid: str
    value: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Optional raw dump or extra info
    varbinds_json: Optional[str] = None 
