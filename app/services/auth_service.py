from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password, verify_password

async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    stmt = select(User).where(User.username == data.username)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    hashed_pwd = hash_password(data.password)
    new_user = User(
        username=data.username,
        password_hash=hashed_pwd,
        name=data.name,
        nickname=data.nickname,
        age=data.age,
        timezone=data.timezone or "UTC",
        status="ACTIVE"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def authenticate_user(db: AsyncSession, username: str, password: str) -> User | None:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user
