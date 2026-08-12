from datetime import date, timedelta
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, Habit, Todo, TodoOccurrence, ActivityLog
from app.schemas.sync import SyncDataResponse, BulkLogsResponse
from app.schemas.log import ActivityLogCreate, ActivityLogResponse
from app.schemas.user import UserResponse
from app.schemas.habit import HabitResponse
from app.schemas.todo import TodoResponse, TodoOccurrenceResponse
from app.services.analytics_service import get_overview_analytics
from app.core.dependencies import get_user_today

async def get_sync_data(db: AsyncSession, user: User, days: int = 3) -> SyncDataResponse:
    if days < 1:
        days = 1
    elif days > 30:
        days = 30
        
    user_today = get_user_today(user.timezone)
    from_date = user_today - timedelta(days=days)
    
    # User habits
    h_stmt = select(Habit).where(Habit.user_id == user.id)
    habits = list((await db.execute(h_stmt)).scalars().all())
    
    # User todos
    t_stmt = select(Todo).where(Todo.user_id == user.id, Todo.deleted_at.is_(None))
    todos = list((await db.execute(t_stmt)).scalars().all())
    
    # Occurrences in date range
    o_stmt = (
        select(TodoOccurrence)
        .join(Todo, TodoOccurrence.todo_id == Todo.id)
        .where(Todo.user_id == user.id, TodoOccurrence.for_date >= from_date)
    )
    occurrences = list((await db.execute(o_stmt)).scalars().all())
    
    # Activity logs in date range
    l_stmt = select(ActivityLog).where(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_date >= from_date
    )
    logs = list((await db.execute(l_stmt)).scalars().all())
    
    # Overview analytics
    analytics = await get_overview_analytics(db, user)
    
    return SyncDataResponse(
        user=UserResponse.model_validate(user),
        habits=[HabitResponse.model_validate(h) for h in habits],
        todos=[TodoResponse.model_validate(t) for t in todos],
        todo_occurrences=[TodoOccurrenceResponse.model_validate(o) for o in occurrences],
        logs=[ActivityLogResponse.model_validate(l) for l in logs],
        analytics=analytics
    )

async def bulk_create_logs(db: AsyncSession, user: User, logs_data: List[ActivityLogCreate]) -> BulkLogsResponse:
    user_today = get_user_today(user.timezone)
    inserted_logs = []
    inserted_count = 0
    duplicate_count = 0
    failed_count = 0
    errors = []
    
    seen_event_ids = set()

    for idx, item in enumerate(logs_data):
        try:
            # 1. Validate date
            if item.activity_date != user_today:
                failed_count += 1
                errors.append(f"Item #{idx}: Activity log date must be today ({user_today})")
                continue
                
            # 2. Check score and multiplier
            if not (1 <= item.score <= 10):
                failed_count += 1
                errors.append(f"Item #{idx}: Score must be between 1 and 10")
                continue
            if item.multiplier < 1:
                failed_count += 1
                errors.append(f"Item #{idx}: Multiplier must be >= 1")
                continue
                
            # 3. Check idempotency if event_id present
            if item.event_id:
                if item.event_id in seen_event_ids:
                    duplicate_count += 1
                    continue
                seen_event_ids.add(item.event_id)

                stmt = select(ActivityLog).where(ActivityLog.event_id == item.event_id)
                res = await db.execute(stmt)
                if res.scalar_one_or_none():
                    duplicate_count += 1
                    continue

            # 4. Target validation
            if item.type == "HABIT":
                stmt = select(Habit).where(Habit.id == item.habit_id, Habit.user_id == user.id)
                if not (await db.execute(stmt)).scalar_one_or_none():
                    failed_count += 1
                    errors.append(f"Item #{idx}: Habit not found or unauthorized")
                    continue
            elif item.type == "TODO":
                stmt = (
                    select(TodoOccurrence)
                    .join(Todo, TodoOccurrence.todo_id == Todo.id)
                    .where(TodoOccurrence.id == item.todo_occurrence_id, Todo.user_id == user.id, Todo.deleted_at.is_(None))
                )
                occ = (await db.execute(stmt)).scalar_one_or_none()
                if not occ:
                    failed_count += 1
                    errors.append(f"Item #{idx}: Todo occurrence not found or unauthorized")
                    continue
                if occ.status == "PENDING":
                    occ.status = "COMPLETED"

            # Create log
            log_entry = ActivityLog(
                event_id=item.event_id,
                user_id=user.id,
                type=item.type,
                habit_id=item.habit_id if item.type == "HABIT" else None,
                todo_occurrence_id=item.todo_occurrence_id if item.type == "TODO" else None,
                activity_date=item.activity_date,
                score=item.score,
                multiplier=item.multiplier,
                duration_minutes=item.duration_minutes
            )
            db.add(log_entry)
            inserted_logs.append(log_entry)
            inserted_count += 1
            
        except Exception as e:
            failed_count += 1
            errors.append(f"Item #{idx}: {str(e)}")

    if inserted_count > 0:
        await db.commit()
        for log_entry in inserted_logs:
            await db.refresh(log_entry)

    return BulkLogsResponse(
        inserted=inserted_count,
        duplicates=duplicate_count,
        failed=failed_count,
        logs=[ActivityLogResponse.model_validate(l) for l in inserted_logs],
        errors=errors
    )
