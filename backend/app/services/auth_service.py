from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import blacklist_refresh_token, is_refresh_token_blacklisted
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.repositories.profile_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.tokens = RefreshTokenRepository(db)

    async def register(self, data: UserCreate) -> UserResponse:
        if await self.users.get_by_email(data.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if await self.users.get_by_username(data.username):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

        user = User(
            email=data.email,
            username=data.username,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )
        user = await self.users.create(user)
        return UserResponse.model_validate(user)

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        return await self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        jti = payload.get("jti")
        user_id = payload.get("sub")
        if not jti or not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        if await is_refresh_token_blacklisted(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

        stored = await self.tokens.get_by_jti(jti)
        if stored is None or stored.revoked or stored.expires_at < datetime.now(tz=UTC):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

        user = await self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        await self.tokens.revoke(stored)
        await blacklist_refresh_token(jti, ttl_seconds=7 * 24 * 3600)
        return await self._issue_tokens(user)

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        stored = await self.tokens.get_by_jti(jti)
        if stored:
            await self.tokens.revoke(stored)
        await blacklist_refresh_token(jti, ttl_seconds=7 * 24 * 3600)

    async def _issue_tokens(self, user: User) -> TokenResponse:
        access = create_access_token(str(user.id), extra={"email": user.email})
        refresh, jti = create_refresh_token(str(user.id))
        expires_at = datetime.now(tz=UTC) + timedelta(days=7)
        await self.tokens.create(
            RefreshToken(user_id=user.id, jti=jti, expires_at=expires_at, revoked=False)
        )
        return TokenResponse(access_token=access, refresh_token=refresh)
