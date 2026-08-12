import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.todo import (
    TodoCreate, TodoUpdate, TodoResponse,
    TodoOccurrenceCreate, TodoOccurrenceUpdate, TodoOccurrenceResponse
)
from app.schemas.log import ActivityLogResponse
from app.core.dependencies import get_current_user
from app.services import todo_service, log_service

router = APIRouter(prefix="/todos", tags=["Todos"])
occurrences_router = APIRouter(prefix="/todo-occurrences", tags=["Todo Occurrences"])

# --- Todos Endpoints ---

@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    data: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.create_todo(db, current_user.id, data)

@router.get("", response_model=List[TodoResponse])
async def list_todos(
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, COMPLETED, etc.)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.get_user_todos(db, current_user.id, status, limit, offset)

@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.get_todo_by_id(db, current_user.id, todo_id)

@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: uuid.UUID,
    data: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.update_todo(db, current_user.id, todo_id, data)

@router.delete("/{todo_id}")
async def delete_todo(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await todo_service.delete_todo(db, current_user.id, todo_id)
    return {"detail": "Todo deleted successfully"}

# --- Todo Occurrence Endpoints under /todos/{todo_id}/occurrences ---

@router.post("/{todo_id}/occurrences", response_model=TodoOccurrenceResponse, status_code=status.HTTP_201_CREATED)
async def create_occurrence(
    todo_id: uuid.UUID,
    data: TodoOccurrenceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.create_occurrence(db, current_user, todo_id, data)

@router.get("/{todo_id}/occurrences", response_model=List[TodoOccurrenceResponse])
async def list_todo_occurrences(
    todo_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.get_todo_occurrences(db, current_user.id, todo_id, limit, offset)

# --- Direct Todo Occurrence Endpoints under /todo-occurrences/{occurrence_id} ---

@occurrences_router.get("/{occurrence_id}", response_model=TodoOccurrenceResponse)
async def get_occurrence(
    occurrence_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.get_occurrence_by_id(db, current_user.id, occurrence_id)

@occurrences_router.patch("/{occurrence_id}", response_model=TodoOccurrenceResponse)
async def update_occurrence(
    occurrence_id: uuid.UUID,
    data: TodoOccurrenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await todo_service.update_occurrence(db, current_user.id, occurrence_id, data)

@occurrences_router.delete("/{occurrence_id}")
async def delete_occurrence(
    occurrence_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await todo_service.delete_occurrence(db, current_user.id, occurrence_id)
    return {"detail": "Occurrence deleted successfully"}

@occurrences_router.get("/{occurrence_id}/logs", response_model=List[ActivityLogResponse])
async def get_occurrence_logs(
    occurrence_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.get_occurrence_logs(db, current_user.id, occurrence_id, limit, offset)
