from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    name: Optional[str] = None
    nickname: Optional[str] = None
    age: Optional[int] = None
    timezone: str
    status: str
    scheduled_days: int
    completed_days: int
    progress_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    age: Optional[int] = None
    timezone: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
