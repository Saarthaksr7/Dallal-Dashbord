from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class ApiKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    
    key_hash: str = Field(index=True, unique=True)
    key_prefix: str = Field(max_length=10) # For display (e.g. sk_live_1234...)
    
    name: str
    scopes: str = Field(default="") # comma-separated
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    is_active: bool = Field(default=True)
