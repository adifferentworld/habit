import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse
from app.schemas.log import ActivityLogResponse
from app.core.dependencies import get_current_user
from app.services import habit_service, log_service

router = APIRouter(prefix="/habits", tags=["Habits"])

@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.create_habit(db, current_user, data)

@router.get("", response_model=List[HabitResponse])
async def list_habits(
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, STOPPED, etc.)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.get_user_habits(db, current_user.id, status, limit, offset)

@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.get_habit_by_id(db, current_user.id, habit_id)

@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: uuid.UUID,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.update_habit(db, current_user.id, habit_id, data)

@router.post("/{habit_id}/stop", response_model=HabitResponse)
async def stop_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.stop_habit(db, current_user, habit_id)

@router.post("/{habit_id}/resume", response_model=HabitResponse)
async def resume_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await habit_service.resume_habit(db, current_user, habit_id)

@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await habit_service.delete_habit(db, current_user.id, habit_id)
    return {"detail": "Habit deleted successfully"}

@router.get("/{habit_id}/logs", response_model=List[ActivityLogResponse])
async def get_habit_logs(
    habit_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.get_habit_logs(db, current_user.id, habit_id, limit, offset)
