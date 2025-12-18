from typing import Optional
from sqlmodel import Field, SQLModel

class Setting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str = Field(description="JSON value string or simple string")
    category: str = Field(default="general", index=True)
    description: Optional[str] = None
