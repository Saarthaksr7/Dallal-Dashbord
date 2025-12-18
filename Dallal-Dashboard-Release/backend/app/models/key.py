from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Key(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    type: str  # e.g., 'ssh_password', 'ssh_key', 'api_token'
    encrypted_value: str
    fingerprint: Optional[str] = None  # Store hash/fingerprint for display
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
