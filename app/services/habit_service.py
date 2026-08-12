import uuid
from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.db.models import Habit, User
from app.schemas.habit import HabitCreate, HabitUpdate
from app.core.dependencies import get_user_today

async def create_habit(db: AsyncSession, user: User, data: HabitCreate) -> Habit:
    user_today = get_user_today(user.timezone)
    started_at = data.started_at or user_today
    
    new_habit = Habit(
        user_id=user.id,
        title=data.title,
        description=data.description,
        importance_score=data.importance_score,
        status="ACTIVE",
        designated_week_days=data.designated_week_days,
        started_at=started_at,
        scheduled_time=data.scheduled_time,
        estimated_minutes=data.estimated_minutes,
        scheduled_days=0,
        completed_days=0,
        progress_score=0.0
    )
    
    db.add(new_habit)
    await db.commit()
    await db.refresh(new_habit)
    return new_habit

async def get_user_habits(
    db: AsyncSession,
    user_id: uuid.UUID,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Habit]:
    stmt = select(Habit).where(Habit.user_id == user_id, Habit.deleted == False)
    if status_filter:
        stmt = stmt.where(Habit.status == status_filter.upper())
    stmt = stmt.order_by(Habit.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_habit_by_id(db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID) -> Habit:
    stmt = select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id, Habit.deleted == False)
    result = await db.execute(stmt)
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    return habit

async def update_habit(db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID, data: HabitUpdate) -> Habit:
    habit = await get_habit_by_id(db, user_id, habit_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(habit, field, value)
            
    await db.commit()
    await db.refresh(habit)
    return habit

async def stop_habit(db: AsyncSession, user: User, habit_id: uuid.UUID) -> Habit:
    habit = await get_habit_by_id(db, user.id, habit_id)
    user_today = get_user_today(user.timezone)
    
    habit.status = "STOPPED"
    habit.stopped_at = user_today
    
    await db.commit()
    await db.refresh(habit)
    return habit

async def resume_habit(db: AsyncSession, user: User, habit_id: uuid.UUID) -> Habit:
    habit = await get_habit_by_id(db, user.id, habit_id)
    
    habit.status = "ACTIVE"
    habit.stopped_at = None
    
    await db.commit()
    await db.refresh(habit)
    return habit

async def delete_habit(db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID) -> None:
    habit = await get_habit_by_id(db, user_id, habit_id)
    habit.deleted = True
    await db.commit()
