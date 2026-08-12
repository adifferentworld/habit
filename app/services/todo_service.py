import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Todo, TodoOccurrence, User
from app.schemas.todo import TodoCreate, TodoUpdate, TodoOccurrenceCreate, TodoOccurrenceUpdate
from app.core.dependencies import get_user_today

async def create_todo(db: AsyncSession, user_id: uuid.UUID, data: TodoCreate) -> Todo:
    new_todo = Todo(
        user_id=user_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="ACTIVE",
        estimated_minutes=data.estimated_minutes,
        scheduled_count=0,
        completed_count=0,
        progress_score=0.0
    )
    db.add(new_todo)
    await db.commit()
    await db.refresh(new_todo)
    return new_todo

async def get_user_todos(
    db: AsyncSession,
    user_id: uuid.UUID,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Todo]:
    stmt = select(Todo).where(Todo.user_id == user_id, Todo.deleted == False, Todo.deleted_at.is_(None))
    if status_filter:
        stmt = stmt.where(Todo.status == status_filter.upper())
    stmt = stmt.order_by(Todo.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_todo_by_id(db: AsyncSession, user_id: uuid.UUID, todo_id: uuid.UUID) -> Todo:
    stmt = select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id, Todo.deleted == False, Todo.deleted_at.is_(None))
    result = await db.execute(stmt)
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    return todo

async def update_todo(db: AsyncSession, user_id: uuid.UUID, todo_id: uuid.UUID, data: TodoUpdate) -> Todo:
    todo = await get_todo_by_id(db, user_id, todo_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(todo, field, value)
            
    await db.commit()
    await db.refresh(todo)
    return todo

async def delete_todo(db: AsyncSession, user_id: uuid.UUID, todo_id: uuid.UUID) -> None:
    todo = await get_todo_by_id(db, user_id, todo_id)
    todo.deleted = True
    todo.deleted_at = datetime.now(timezone.utc)
    await db.commit()

# --- Todo Occurrence Methods ---

async def create_occurrence(
    db: AsyncSession,
    user: User,
    todo_id: uuid.UUID,
    data: TodoOccurrenceCreate
) -> TodoOccurrence:
    todo = await get_todo_by_id(db, user.id, todo_id)
    user_today = get_user_today(user.timezone)
    
    # Critical Rule: Cannot create occurrence for a past date
    if data.for_date < user_today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create todo occurrence for past date"
        )
    
    occurrence = TodoOccurrence(
        todo_id=todo.id,
        for_date=data.for_date,
        scheduled_at=data.scheduled_at,
        status="PENDING",
        estimated_minutes=data.estimated_minutes or todo.estimated_minutes
    )
    
    todo.scheduled_count += 1
    
    db.add(occurrence)
    await db.commit()
    await db.refresh(occurrence)
    return occurrence

async def get_todo_occurrences(
    db: AsyncSession,
    user_id: uuid.UUID,
    todo_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0
) -> List[TodoOccurrence]:
    todo = await get_todo_by_id(db, user_id, todo_id)
    stmt = select(TodoOccurrence).where(TodoOccurrence.todo_id == todo.id, TodoOccurrence.deleted == False).order_by(TodoOccurrence.for_date.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_occurrence_by_id(db: AsyncSession, user_id: uuid.UUID, occurrence_id: uuid.UUID) -> TodoOccurrence:
    stmt = (
        select(TodoOccurrence)
        .join(Todo, TodoOccurrence.todo_id == Todo.id)
        .where(TodoOccurrence.id == occurrence_id, Todo.user_id == user_id, Todo.deleted == False, TodoOccurrence.deleted == False)
    )
    result = await db.execute(stmt)
    occurrence = result.scalar_one_or_none()
    if not occurrence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo occurrence not found"
        )
    return occurrence

async def update_occurrence(
    db: AsyncSession,
    user_id: uuid.UUID,
    occurrence_id: uuid.UUID,
    data: TodoOccurrenceUpdate
) -> TodoOccurrence:
    occurrence = await get_occurrence_by_id(db, user_id, occurrence_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(occurrence, field, value)
            
    await db.commit()
    await db.refresh(occurrence)
    return occurrence

async def delete_occurrence(db: AsyncSession, user_id: uuid.UUID, occurrence_id: uuid.UUID) -> None:
    occurrence = await get_occurrence_by_id(db, user_id, occurrence_id)
    occurrence.deleted = True
    await db.commit()
