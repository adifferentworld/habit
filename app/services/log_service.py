import uuid
from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import ActivityLog, Habit, TodoOccurrence, Todo, User
from app.schemas.log import ActivityLogCreate
from app.core.dependencies import get_user_today

async def create_log(db: AsyncSession, user: User, data: ActivityLogCreate) -> ActivityLog:
    user_today = get_user_today(user.timezone)
    
    # CRITICAL RULE: Log can only be created for TODAY in user's timezone
    if data.activity_date != user_today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity log can only be created for today in user's timezone"
        )
    
    # Score validation
    if not (1 <= data.score <= 10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score must be between 1 and 10"
        )
        
    if data.multiplier < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiplier must be at least 1"
        )
        
    # Idempotency check if event_id is provided
    if data.event_id:
        stmt = select(ActivityLog).where(ActivityLog.event_id == data.event_id)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event ID already logged"
            )

    # Validate target ownership based on type
    if data.type == "HABIT":
        stmt = select(Habit).where(Habit.id == data.habit_id, Habit.user_id == user.id)
        res = await db.execute(stmt)
        habit = res.scalar_one_or_none()
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Habit not found or access denied"
            )
    elif data.type == "TODO":
        stmt = (
            select(TodoOccurrence)
            .join(Todo, TodoOccurrence.todo_id == Todo.id)
            .where(
                TodoOccurrence.id == data.todo_occurrence_id,
                Todo.user_id == user.id,
                Todo.deleted_at.is_(None)
            )
        )
        res = await db.execute(stmt)
        occurrence = res.scalar_one_or_none()
        if not occurrence:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Todo occurrence not found or access denied"
            )
        # Automatically mark occurrence as completed if pending
        if occurrence.status == "PENDING":
            occurrence.status = "COMPLETED"

    new_log = ActivityLog(
        event_id=data.event_id,
        user_id=user.id,
        type=data.type,
        habit_id=data.habit_id if data.type == "HABIT" else None,
        todo_occurrence_id=data.todo_occurrence_id if data.type == "TODO" else None,
        activity_date=data.activity_date,
        score=data.score,
        multiplier=data.multiplier,
        duration_minutes=data.duration_minutes
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log

async def delete_log(db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> None:
    stmt = select(ActivityLog).where(ActivityLog.id == log_id, ActivityLog.user_id == user_id, ActivityLog.deleted == False)
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity log not found"
        )
    log.deleted = True
    await db.commit()

async def get_logs(
    db: AsyncSession,
    user_id: uuid.UUID,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    log_type: Optional[str] = None,
    habit_id: Optional[uuid.UUID] = None,
    todo_occurrence_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0
) -> List[ActivityLog]:
    stmt = select(ActivityLog).where(ActivityLog.user_id == user_id, ActivityLog.deleted == False)
    
    if from_date:
        stmt = stmt.where(ActivityLog.activity_date >= from_date)
    if to_date:
        stmt = stmt.where(ActivityLog.activity_date <= to_date)
    if log_type:
        stmt = stmt.where(ActivityLog.type == log_type.upper())
    if habit_id:
        stmt = stmt.where(ActivityLog.habit_id == habit_id)
    if todo_occurrence_id:
        stmt = stmt.where(ActivityLog.todo_occurrence_id == todo_occurrence_id)
        
    stmt = stmt.order_by(ActivityLog.activity_date.desc(), ActivityLog.performed_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_today_logs(db: AsyncSession, user: User) -> List[ActivityLog]:
    user_today = get_user_today(user.timezone)
    stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == user.id, ActivityLog.activity_date == user_today, ActivityLog.deleted == False)
        .order_by(ActivityLog.performed_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_logs_for_date(db: AsyncSession, user_id: uuid.UUID, target_date: date) -> List[ActivityLog]:
    stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id, ActivityLog.activity_date == target_date, ActivityLog.deleted == False)
        .order_by(ActivityLog.performed_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_habit_logs(db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[ActivityLog]:
    # Ensure habit belongs to user
    stmt_habit = select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id, Habit.deleted == False)
    res = await db.execute(stmt_habit)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id, ActivityLog.habit_id == habit_id, ActivityLog.deleted == False)
        .order_by(ActivityLog.activity_date.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_occurrence_logs(db: AsyncSession, user_id: uuid.UUID, occurrence_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[ActivityLog]:
    # Ensure occurrence belongs to user
    stmt_occ = (
        select(TodoOccurrence)
        .join(Todo, TodoOccurrence.todo_id == Todo.id)
        .where(TodoOccurrence.id == occurrence_id, Todo.user_id == user_id, Todo.deleted == False, TodoOccurrence.deleted == False)
    )
    res = await db.execute(stmt_occ)
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo occurrence not found")
        
    stmt = (
        select(ActivityLog)
        .where(ActivityLog.user_id == user_id, ActivityLog.todo_occurrence_id == occurrence_id, ActivityLog.deleted == False)
        .order_by(ActivityLog.activity_date.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
