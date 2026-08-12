from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional
from datetime import datetime, date
import uuid

class ActivityLogCreate(BaseModel):
    type: str = Field(..., pattern="^(HABIT|TODO)$")
    habit_id: Optional[uuid.UUID] = None
    todo_occurrence_id: Optional[uuid.UUID] = None
    activity_date: date
    score: int = Field(..., ge=1, le=10)
    multiplier: int = Field(1, ge=1)
    duration_minutes: Optional[int] = Field(None, ge=0)
    event_id: Optional[str] = Field(None, max_length=255)

    @model_validator(mode="after")
    def validate_type_and_targets(self):
        if self.type == "HABIT":
            if not self.habit_id:
                raise ValueError("habit_id is required when type is HABIT")
            if self.todo_occurrence_id:
                raise ValueError("todo_occurrence_id must be null when type is HABIT")
        elif self.type == "TODO":
            if not self.todo_occurrence_id:
                raise ValueError("todo_occurrence_id is required when type is TODO")
            if self.habit_id:
                raise ValueError("habit_id must be null when type is TODO")
        return self

class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    event_id: Optional[str] = None
    user_id: uuid.UUID
    type: str
    habit_id: Optional[uuid.UUID] = None
    todo_occurrence_id: Optional[uuid.UUID] = None
    activity_date: date
    performed_at: datetime
    score: int
    multiplier: int
    duration_minutes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
