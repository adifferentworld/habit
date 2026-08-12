from pydantic import BaseModel
from typing import List, Optional
from app.schemas.user import UserResponse
from app.schemas.habit import HabitResponse
from app.schemas.todo import TodoResponse, TodoOccurrenceResponse
from app.schemas.log import ActivityLogResponse, ActivityLogCreate
from app.schemas.analytics import OverviewAnalytics

class SyncDataResponse(BaseModel):
    user: UserResponse
    habits: List[HabitResponse]
    todos: List[TodoResponse]
    todo_occurrences: List[TodoOccurrenceResponse]
    logs: List[ActivityLogResponse]
    analytics: OverviewAnalytics

class BulkLogsRequest(BaseModel):
    logs: List[ActivityLogCreate]

class BulkLogsResponse(BaseModel):
    inserted: int
    duplicates: int
    failed: int
    logs: List[ActivityLogResponse]
    errors: List[str]
