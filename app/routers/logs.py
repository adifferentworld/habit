import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.log import ActivityLogCreate, ActivityLogResponse
from app.core.dependencies import get_current_user
from app.services import log_service

router = APIRouter(prefix="/logs", tags=["Activity Logs"])

@router.post("", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(
    data: ActivityLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.create_log(db, current_user, data)

@router.get("", response_model=List[ActivityLogResponse])
async def list_logs(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    type: Optional[str] = Query(None, description="HABIT or TODO"),
    habit_id: Optional[uuid.UUID] = Query(None),
    todo_occurrence_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.get_logs(
        db, current_user.id, from_date, to_date, type, habit_id, todo_occurrence_id, limit, offset
    )

@router.get("/today", response_model=List[ActivityLogResponse])
async def get_today_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.get_today_logs(db, current_user)

@router.get("/date/{date_val}", response_model=List[ActivityLogResponse])
async def get_logs_for_date(
    date_val: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await log_service.get_logs_for_date(db, current_user.id, date_val)

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await log_service.delete_log(db, current_user.id, log_id)
