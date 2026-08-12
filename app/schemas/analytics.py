from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import date
import uuid

class OverviewAnalytics(BaseModel):
    total_habits: int
    active_habits: int
    inactive_habits: int
    total_todos: int
    active_todos: int
    completed_todos: int
    total_activity_logs: int
    total_time_spent: int
    average_activity_score: float
    overall_progress: float

class DailyAnalytics(BaseModel):
    date: date
    log_count: int
    completed_activities: int
    average_score: float
    total_minutes: int

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int

class HabitAnalytics(BaseModel):
    habit_id: uuid.UUID
    title: str
    status: str
    designated_week_days: List[str]
    scheduled_days: int
    completed_days: int
    progress_score: float
    total_logs: int
    average_score: float
    total_minutes: int
    current_streak: int
    longest_streak: int
    completion_by_weekday: Dict[str, int]

class TodoAnalytics(BaseModel):
    todo_id: uuid.UUID
    title: str
    priority: str
    status: str
    scheduled_occurrences: int
    completed_occurrences: int
    progress_score: float
    total_logs: int
    average_score: float
    total_minutes: int
    current_streak: int
    longest_streak: int

class PeriodAnalytics(BaseModel):
    period: str
    total_logs: int
    total_minutes: int
    average_score: float
    completion_rate: float
