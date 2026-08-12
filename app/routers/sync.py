from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas.sync import SyncDataResponse, BulkLogsRequest, BulkLogsResponse
from app.core.dependencies import get_current_user
from app.services import sync_service

router = APIRouter(prefix="/sync", tags=["Data Sync"])

@router.get("", response_model=SyncDataResponse)
async def sync_user_data(
    days: int = Query(3, ge=1, le=30, description="Number of past days to fetch"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await sync_service.get_sync_data(db, current_user, days)

@router.post("/logs", response_model=BulkLogsResponse, status_code=status.HTTP_200_OK)
async def sync_bulk_logs(
    body: BulkLogsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await sync_service.bulk_create_logs(db, current_user, body.logs)
