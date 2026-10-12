"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("jti", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "competitive_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("codeforces_handle", sa.String(100), nullable=True),
        sa.Column("leetcode_username", sa.String(100), nullable=True),
        sa.Column("codeforces_rating", sa.Integer(), nullable=True),
        sa.Column("leetcode_rating", sa.Integer(), nullable=True),
        sa.Column("max_codeforces_rating", sa.Integer(), nullable=True),
        sa.Column("max_leetcode_rating", sa.Integer(), nullable=True),
        sa.Column("total_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("easy_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("medium_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("hard_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("contest_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "rating_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("competitive_profiles.id", ondelete="CASCADE")),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("contest_name", sa.String(255), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("competitive_profiles.id", ondelete="CASCADE")),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("problem_slug", sa.String(255), nullable=False),
        sa.Column("problem_title", sa.String(255), nullable=False),
        sa.Column("difficulty", sa.String(50), nullable=False),
        sa.Column("topics", postgresql.JSONB(), nullable=False),
        sa.Column("verdict", sa.String(50), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "topic_scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("competitive_profiles.id", ondelete="CASCADE")),
        sa.Column("topic", sa.String(100), nullable=False),
        sa.Column("strength_score", sa.Float(), nullable=False),
        sa.Column("weakness_score", sa.Float(), nullable=False),
        sa.Column("problems_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("problems_attempted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "roadmaps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("duration_weeks", sa.Integer(), nullable=False),
        sa.Column("target_rating", sa.Integer(), nullable=False),
        sa.Column("current_rating", sa.Integer(), nullable=False),
        sa.Column("weak_topics", postgresql.JSONB(), nullable=False),
        sa.Column("plan", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE")),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "code_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("problem_title", sa.String(255), nullable=True),
        sa.Column("language", sa.String(50), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("analysis", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "problem_catalog",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("difficulty", sa.String(50), nullable=False),
        sa.Column("topics", postgresql.JSONB(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("url", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("problem_catalog")
    op.drop_table("code_reviews")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("roadmaps")
    op.drop_table("topic_scores")
    op.drop_table("submissions")
    op.drop_table("rating_history")
    op.drop_table("competitive_profiles")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
