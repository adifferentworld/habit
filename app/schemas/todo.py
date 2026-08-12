from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime, date
import uuid

class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: str = Field("MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")
    estimated_minutes: Optional[int] = Field(None, ge=1)

class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH)$")
    status: Optional[str] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)

class TodoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    estimated_minutes: Optional[int] = None
    scheduled_count: int
    completed_count: int
    progress_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TodoOccurrenceCreate(BaseModel):
    for_date: date
    scheduled_at: Optional[datetime] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)

class TodoOccurrenceUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)

class TodoOccurrenceResponse(BaseModel):
    id: uuid.UUID
    todo_id: uuid.UUID
    for_date: date
    scheduled_at: Optional[datetime] = None
    status: str
    estimated_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
