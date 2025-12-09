from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    username: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
