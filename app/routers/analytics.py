import uuid
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.analytics import (
    OverviewAnalytics, DailyAnalytics, StreakResponse, HabitAnalytics, TodoAnalytics, PeriodAnalytics
)
from app.core.dependencies import get_current_user, get_user_today
from app.services import analytics_service, habit_service, todo_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=OverviewAnalytics)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await analytics_service.get_overview_analytics(db, current_user)

@router.get("/daily", response_model=List[DailyAnalytics])
async def get_daily(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await analytics_service.get_daily_analytics(db, current_user, from_date, to_date)

@router.get("/streaks", response_model=StreakResponse)
async def get_overall_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    overview = await analytics_service.get_overview_analytics(db, current_user)
    # Simple overall streak indicator based on daily active logs
    daily_logs = await analytics_service.get_daily_analytics(db, current_user)
    user_today = get_user_today(current_user.timezone)
    
    logged_dates = set(d.date for d in daily_logs)
    curr_streak = 0
    max_streak = 0
    
    check_date = user_today
    if check_date not in logged_dates:
        check_date -= timedelta(days=1)
        
    while check_date in logged_dates:
        curr_streak += 1
        check_date -= timedelta(days=1)
        
    return StreakResponse(current_streak=curr_streak, longest_streak=max(curr_streak, len(logged_dates)))

@router.get("/habits/{habit_id}", response_model=HabitAnalytics)
async def get_habit_analytics(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await analytics_service.get_habit_analytics(db, current_user, habit_id)

@router.get("/habits/{habit_id}/streak", response_model=StreakResponse)
async def get_habit_streak(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    habit = await habit_service.get_habit_by_id(db, current_user.id, habit_id)
    return await analytics_service.calculate_habit_streak(db, current_user, habit)

@router.get("/todos/{todo_id}", response_model=TodoAnalytics)
async def get_todo_analytics(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await analytics_service.get_todo_analytics(db, current_user, todo_id)

@router.get("/todos/{todo_id}/streak", response_model=StreakResponse)
async def get_todo_streak(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    todo = await todo_service.get_todo_by_id(db, current_user.id, todo_id)
    return await analytics_service.calculate_todo_streak(db, current_user, todo)

@router.get("/weekly", response_model=PeriodAnalytics)
async def get_weekly_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_today = get_user_today(current_user.timezone)
    from_date = user_today - timedelta(days=7)
    daily = await analytics_service.get_daily_analytics(db, current_user, from_date, user_today)
    
    total_logs = sum(d.log_count for d in daily)
    total_minutes = sum(d.total_minutes for d in daily)
    avg_score = round(sum(d.average_score for d in daily) / max(len(daily), 1), 2)
    
    return PeriodAnalytics(
        period="Last 7 Days",
        total_logs=total_logs,
        total_minutes=total_minutes,
        average_score=avg_score,
        completion_rate=round(len(daily) / 7.0 * 100, 2)
    )

@router.get("/monthly", response_model=PeriodAnalytics)
async def get_monthly_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_today = get_user_today(current_user.timezone)
    from_date = user_today - timedelta(days=30)
    daily = await analytics_service.get_daily_analytics(db, current_user, from_date, user_today)
    
    total_logs = sum(d.log_count for d in daily)
    total_minutes = sum(d.total_minutes for d in daily)
    avg_score = round(sum(d.average_score for d in daily) / max(len(daily), 1), 2)
    
    return PeriodAnalytics(
        period="Last 30 Days",
        total_logs=total_logs,
        total_minutes=total_minutes,
        average_score=avg_score,
        completion_rate=round(len(daily) / 30.0 * 100, 2)
    )
