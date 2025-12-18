from typing import Optional, List
from sqlmodel import Field, SQLModel, JSON
from datetime import datetime

class Webhook(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    url: str
    secret: Optional[str] = None
    events: List[str] = Field(default=[], sa_type=JSON) # e.g. ["status_change", "service_down"]
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
