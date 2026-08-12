from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime, date, time
import uuid

ALLOWED_WEEKDAYS = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"}

class HabitCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    importance_score: int = Field(1, ge=1, le=10)
    designated_week_days: List[str]
    started_at: Optional[date] = None
    scheduled_time: Optional[time] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)

    @field_validator("designated_week_days")

    def validate_weekdays(cls, v):
        if not v:
            raise ValueError("At least one designated weekday must be specified")
        normalized = []
        for day in v:
            day_upper = day.upper().strip()
            if day_upper not in ALLOWED_WEEKDAYS:
                raise ValueError(f"Invalid weekday: {day}. Must be one of {sorted(list(ALLOWED_WEEKDAYS))}")
            if day_upper not in normalized:
                normalized.append(day_upper)
        return normalized

class HabitUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    importance_score: Optional[int] = Field(None, ge=1, le=10)
    designated_week_days: Optional[List[str]] = None
    scheduled_time: Optional[time] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)

    @field_validator("designated_week_days")

    def validate_weekdays(cls, v):
        if v is None:
            return v
        if not v:
            raise ValueError("At least one designated weekday must be specified")
        normalized = []
        for day in v:
            day_upper = day.upper().strip()
            if day_upper not in ALLOWED_WEEKDAYS:
                raise ValueError(f"Invalid weekday: {day}. Must be one of {sorted(list(ALLOWED_WEEKDAYS))}")
            if day_upper not in normalized:
                normalized.append(day_upper)
        return normalized

class HabitResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    importance_score: int
    status: str
    designated_week_days: List[str]
    started_at: date
    stopped_at: Optional[date] = None
    scheduled_time: Optional[time] = None
    estimated_minutes: Optional[int] = None
    scheduled_days: int
    completed_days: int
    progress_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
