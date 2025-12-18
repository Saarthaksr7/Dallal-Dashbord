from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class ServiceHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: int = Field(index=True, foreign_key="service.id")
    is_active: bool
    latency_ms: int
    cpu_usage: Optional[float] = None
    ram_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
