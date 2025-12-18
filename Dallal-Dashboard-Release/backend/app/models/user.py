from typing import Optional, Dict
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="user") # 'admin' or 'user'
    is_active: bool = True
    is_superuser: bool = False
    preferences: Dict = Field(default={}, sa_column=Column(JSON))
