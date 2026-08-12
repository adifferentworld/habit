import uuid
from datetime import date, timedelta
from typing import List, Optional, Dict
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.db.models import Habit, Todo, TodoOccurrence, ActivityLog, User
from app.schemas.analytics import (
    OverviewAnalytics, DailyAnalytics, StreakResponse, HabitAnalytics, TodoAnalytics
)
from app.core.dependencies import get_user_today

WEEKDAY_MAP = {
    0: "MONDAY",
    1: "TUESDAY",
    2: "WEDNESDAY",
    3: "THURSDAY",
    4: "FRIDAY",
    5: "SATURDAY",
    6: "SUNDAY"
}

async def calculate_habit_streak(db: AsyncSession, user: User, habit: Habit) -> StreakResponse:
    user_today = get_user_today(user.timezone)
    
    # Fetch all activity log dates for this habit
    stmt = (
        select(ActivityLog.activity_date)
        .where(ActivityLog.user_id == user.id, ActivityLog.habit_id == habit.id, ActivityLog.deleted == False)
        .distinct()
    )
    res = await db.execute(stmt)
    logged_dates = set(res.scalars().all())
    
    designated_set = set(d.upper() for d in habit.designated_week_days)
    if not designated_set:
        return StreakResponse(current_streak=0, longest_streak=0)
        
    start_date = habit.started_at
    if start_date > user_today:
        return StreakResponse(current_streak=0, longest_streak=0)
        
    # Generate list of scheduled dates from start_date up to user_today
    scheduled_dates = []
    curr = start_date
    while curr <= user_today:
        weekday_name = WEEKDAY_MAP[curr.weekday()]
        if weekday_name in designated_set:
            scheduled_dates.append(curr)
        curr += timedelta(days=1)
        
    if not scheduled_dates:
        return StreakResponse(current_streak=0, longest_streak=0)
        
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    # Process from earliest scheduled date to latest
    for s_date in scheduled_dates:
        if s_date in logged_dates:
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        else:
            # If s_date is today and not logged yet, don't break streak from yesterday
            if s_date == user_today:
                pass
            else:
                temp_streak = 0
                
    # Calculate current streak backwards from today / yesterday
    curr_streak = 0
    for s_date in reversed(scheduled_dates):
        if s_date in logged_dates:
            curr_streak += 1
        elif s_date == user_today:
            # Today is not logged yet, ignore today and look at previous
            continue
        else:
            break
            
    current_streak = curr_streak
    if current_streak > longest_streak:
        longest_streak = current_streak
        
    return StreakResponse(current_streak=current_streak, longest_streak=longest_streak)

async def calculate_todo_streak(db: AsyncSession, user: User, todo: Todo) -> StreakResponse:
    # Get all occurrences and logs for this todo
    stmt = (
        select(TodoOccurrence.for_date, TodoOccurrence.status)
        .where(TodoOccurrence.todo_id == todo.id, TodoOccurrence.deleted == False)
        .order_by(TodoOccurrence.for_date.asc())
    )
    res = await db.execute(stmt)
    occurrences = res.all()
    
    if not occurrences:
        return StreakResponse(current_streak=0, longest_streak=0)
        
    user_today = get_user_today(user.timezone)
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    for for_date, status_str in occurrences:
        if status_str == "COMPLETED":
            temp_streak += 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
        elif for_date == user_today:
            continue
        else:
            temp_streak = 0
            
    # Calculate current streak backwards
    for for_date, status_str in reversed(occurrences):
        if status_str == "COMPLETED":
            current_streak += 1
        elif for_date == user_today:
            continue
        else:
            break
            
    return StreakResponse(current_streak=current_streak, longest_streak=longest_streak)

async def get_overview_analytics(db: AsyncSession, user: User) -> OverviewAnalytics:
    user_id = user.id
    
    # Habits stats
    habits_stmt = select(
        func.count(Habit.id).label("total"),
        func.count(func.nullif(Habit.status != "ACTIVE", True)).label("active"),
        func.count(func.nullif(Habit.status == "ACTIVE", True)).label("inactive")
    ).where(Habit.user_id == user_id, Habit.deleted == False)
    h_res = (await db.execute(habits_stmt)).one()
    
    # Todos stats
    todos_stmt = select(
        func.count(Todo.id).label("total"),
        func.count(func.nullif(Todo.status != "ACTIVE", True)).label("active"),
        func.count(func.nullif(Todo.status != "COMPLETED", True)).label("completed")
    ).where(Todo.user_id == user_id, Todo.deleted == False, Todo.deleted_at.is_(None))
    t_res = (await db.execute(todos_stmt)).one()
    
    # Logs stats
    logs_stmt = select(
        func.count(ActivityLog.id).label("total_logs"),
        func.coalesce(func.sum(ActivityLog.duration_minutes), 0).label("total_minutes"),
        func.coalesce(func.avg(ActivityLog.score), 0.0).label("avg_score")
    ).where(ActivityLog.user_id == user_id, ActivityLog.deleted == False)
    l_res = (await db.execute(logs_stmt)).one()
    
    return OverviewAnalytics(
        total_habits=h_res.total or 0,
        active_habits=h_res.active or 0,
        inactive_habits=h_res.inactive or 0,
        total_todos=t_res.total or 0,
        active_todos=t_res.active or 0,
        completed_todos=t_res.completed or 0,
        total_activity_logs=l_res.total_logs or 0,
        total_time_spent=l_res.total_minutes or 0,
        average_activity_score=round(float(l_res.avg_score or 0.0), 2),
        overall_progress=float(user.progress_score or 0.0)
    )

async def get_daily_analytics(
    db: AsyncSession,
    user: User,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None
) -> List[DailyAnalytics]:
    stmt = (
        select(
            ActivityLog.activity_date,
            func.count(ActivityLog.id).label("log_count"),
            func.coalesce(func.avg(ActivityLog.score), 0.0).label("avg_score"),
            func.coalesce(func.sum(ActivityLog.duration_minutes), 0).label("total_minutes")
        )
        .where(ActivityLog.user_id == user.id, ActivityLog.deleted == False)
    )
    if from_date:
        stmt = stmt.where(ActivityLog.activity_date >= from_date)
    if to_date:
        stmt = stmt.where(ActivityLog.activity_date <= to_date)
        
    stmt = stmt.group_by(ActivityLog.activity_date).order_by(ActivityLog.activity_date.desc())
    res = await db.execute(stmt)
    
    daily_list = []
    for row in res.all():
        daily_list.append(DailyAnalytics(
            date=row.activity_date,
            log_count=row.log_count,
            completed_activities=row.log_count,
            average_score=round(float(row.avg_score), 2),
            total_minutes=row.total_minutes
        ))
    return daily_list

async def get_habit_analytics(db: AsyncSession, user: User, habit_id: uuid.UUID) -> HabitAnalytics:
    stmt = select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id, Habit.deleted == False)
    habit = (await db.execute(stmt)).scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        
    streak = await calculate_habit_streak(db, user, habit)
    
    log_stmt = select(
        func.count(ActivityLog.id).label("total_logs"),
        func.coalesce(func.avg(ActivityLog.score), 0.0).label("avg_score"),
        func.coalesce(func.sum(ActivityLog.duration_minutes), 0).label("total_minutes")
    ).where(ActivityLog.user_id == user.id, ActivityLog.habit_id == habit.id, ActivityLog.deleted == False)
    l_res = (await db.execute(log_stmt)).one()
    
    # Completion by weekday
    weekday_stmt = select(
        ActivityLog.activity_date
    ).where(ActivityLog.user_id == user.id, ActivityLog.habit_id == habit.id, ActivityLog.deleted == False)
    dates_res = (await db.execute(weekday_stmt)).scalars().all()
    
    weekday_counts = {day: 0 for day in WEEKDAY_MAP.values()}
    for d in dates_res:
        w_name = WEEKDAY_MAP[d.weekday()]
        weekday_counts[w_name] += 1
        
    return HabitAnalytics(
        habit_id=habit.id,
        title=habit.title,
        status=habit.status,
        designated_week_days=habit.designated_week_days,
        scheduled_days=habit.scheduled_days,
        completed_days=habit.completed_days,
        progress_score=float(habit.progress_score),
        total_logs=l_res.total_logs or 0,
        average_score=round(float(l_res.avg_score), 2),
        total_minutes=l_res.total_minutes or 0,
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        completion_by_weekday=weekday_counts
    )

async def get_todo_analytics(db: AsyncSession, user: User, todo_id: uuid.UUID) -> TodoAnalytics:
    stmt = select(Todo).where(Todo.id == todo_id, Todo.user_id == user.id, Todo.deleted == False, Todo.deleted_at.is_(None))
    todo = (await db.execute(stmt)).scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
        
    streak = await calculate_todo_streak(db, user, todo)
    
    log_stmt = (
        select(
            func.count(ActivityLog.id).label("total_logs"),
            func.coalesce(func.avg(ActivityLog.score), 0.0).label("avg_score"),
            func.coalesce(func.sum(ActivityLog.duration_minutes), 0).label("total_minutes")
        )
        .join(TodoOccurrence, ActivityLog.todo_occurrence_id == TodoOccurrence.id)
        .where(ActivityLog.user_id == user.id, TodoOccurrence.todo_id == todo.id, ActivityLog.deleted == False, TodoOccurrence.deleted == False)
    )
    l_res = (await db.execute(log_stmt)).one()
    
    return TodoAnalytics(
        todo_id=todo.id,
        title=todo.title,
        priority=todo.priority,
        status=todo.status,
        scheduled_occurrences=todo.scheduled_count,
        completed_occurrences=todo.completed_count,
        progress_score=float(todo.progress_score),
        total_logs=l_res.total_logs or 0,
        average_score=round(float(l_res.avg_score), 2),
        total_minutes=l_res.total_minutes or 0,
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak
    )
