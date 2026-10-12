# AlgoMentor: current architecture and backend

This document describes the code currently in this workspace. The [earlier cache-miss example](.archify/sequence-web-request-cache-miss-20260930-010749/web-request-cache-miss.html) is a conceptual flow: this backend does **not** cache profile or dashboard responses in Redis.

## Interactive diagrams

- [Whole system](.archify/architecture-algomentor-system-20260930-011327/algomentor-system.html)
- [Backend layers](.archify/architecture-algomentor-backend-20260930-011327/algomentor-backend.html)
- [Registration, login, and protected requests](.archify/sequence-algomentor-auth-20260930-011327/algomentor-auth.html)
- [Refresh and logout](.archify/sequence-algomentor-token-rotation-20260930-011327/algomentor-token-rotation.html)

Open an HTML file in a browser. Each diagram is standalone and includes its own viewer controls.

## System architecture

The browser runs the [Next.js frontend](frontend/app). Its [API client](frontend/lib/api.ts) sends JSON requests to the [FastAPI app](backend/app/main.py) under `/api/v1`. The [router](backend/app/api/v1/router.py) delegates to feature services, which use SQLAlchemy repositories and PostgreSQL. Profile sync calls the public Codeforces REST API, a third-party LeetCode stats API, and the LeetCode GraphQL endpoint through the [platform clients](backend/app/external/platform_clients.py). Tutor and code review call the [Gemini client](backend/app/external/gemini_client.py) when a Gemini key is configured; otherwise that client returns built-in fallback content.

The [Docker Compose file](docker-compose.yml) starts Next.js, FastAPI, PostgreSQL 16, and Redis 7. The [database session](backend/app/db/session.py) uses the async PostgreSQL driver. Redis is used by the [authentication dependency](backend/app/core/deps.py) to store and check revoked refresh-token identifiers. There is no application-data cache lookup or fill in the current backend.

## Authentication as implemented

1. `POST /api/v1/auth/register` checks email and username uniqueness, hashes the password with bcrypt, and inserts a user. It returns the user record, not tokens. See [auth service](backend/app/services/auth_service.py) and [auth schema](backend/app/schemas/auth.py).
2. `POST /api/v1/auth/login` verifies the password and active status, signs a 30-minute access JWT and 7-day refresh JWT by default, then stores the refresh token's `jti` in PostgreSQL. See [JWT logic](backend/app/core/security.py).
3. The frontend stores both tokens in browser `localStorage` and sends the access token as `Authorization: Bearer ...`. On a `401`, its [API client](frontend/lib/api.ts) attempts one refresh and retries the request.
4. Protected endpoints use [get_current_user](backend/app/core/deps.py) to decode an access JWT, check its type, and load an active user from PostgreSQL. The dashboard layout only checks that a token exists locally; the API performs the actual validation.
5. `POST /api/v1/auth/refresh` validates the refresh JWT and type, checks the Redis denylist and PostgreSQL token row, revokes the old row, writes the old `jti` to Redis, and issues a new token pair with a new database row.
6. `POST /api/v1/auth/logout` revokes the submitted refresh token in PostgreSQL and writes its `jti` to Redis. Already issued access tokens remain usable until their expiry.

Current development security limits: the example configuration contains a known JWT secret and database password; the seed creates a demo account with a published password; and tokens in `localStorage` are accessible to JavaScript running in the page. Replace the example secrets before any shared deployment. The present code does not implement access-token revocation, cookie sessions, OAuth, email verification, password reset, or rate limiting.

## Backend map

| Layer | Current responsibility | Code |
| --- | --- | --- |
| HTTP entry | FastAPI app, CORS, health route, `/api/v1` registration | [main.py](backend/app/main.py), [router.py](backend/app/api/v1/router.py) |
| Auth | User registration, login, refresh rotation, logout, bearer validation | [auth.py](backend/app/api/v1/auth.py), [auth_service.py](backend/app/services/auth_service.py), [deps.py](backend/app/core/deps.py) |
| Profiles | Fetch Codeforces, third-party LeetCode stats, and LeetCode GraphQL data; normalize submissions and ratings; write profile and topic scores | [profile_service.py](backend/app/services/profile_service.py), [platform_clients.py](backend/app/external/platform_clients.py) |
| Analytics | Build dashboard statistics, rating chart, topic radar, and weakness heatmap from stored profile data | [analytics_service.py](backend/app/services/analytics_service.py) |
| Study features | Generate and list roadmaps; recommend problems from the catalog | [roadmap_service.py](backend/app/services/roadmap_service.py), [recommendation_service.py](backend/app/services/recommendation_service.py) |
| AI features | Tutor conversations and code reviews, with optional Gemini calls and fallback content | [tutor_service.py](backend/app/services/tutor_service.py), [code_review_service.py](backend/app/services/code_review_service.py), [gemini_client.py](backend/app/external/gemini_client.py) |
| Predictions | Rating forecasts and interview-readiness scores | [prediction_service.py](backend/app/services/prediction_service.py) |
| Persistence | SQLAlchemy models and repository methods; Alembic migrations | [models/user.py](backend/app/models/user.py), [repositories](backend/app/repositories), [alembic](backend/alembic) |

### HTTP endpoints

| Family | Routes |
| --- | --- |
| Public | `GET /health`; `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout` |
| Profiles | `GET /api/v1/profiles/me`; `POST /api/v1/profiles/sync` |
| Analytics | `GET /api/v1/analytics/dashboard` |
| Roadmaps | `POST /api/v1/roadmaps/generate`; `GET /api/v1/roadmaps` |
| Tutor | `POST /api/v1/tutor/sessions`; `GET /api/v1/tutor/sessions`, `/sessions/{id}`; `POST /api/v1/tutor/sessions/{id}/messages` |
| Code review | `POST /api/v1/code-review`; `GET /api/v1/code-review/history` |
| Predictions | `GET /api/v1/predictions/ratings`, `/interview-readiness`, `/recommendations` |

All profile, analytics, roadmap, tutor, code-review, and prediction routes depend on `get_current_user`. FastAPI's generated API reference is at `http://localhost:8000/docs` when the backend is running.

### Stored data

The [models](backend/app/models/user.py) define `users`, `refresh_tokens`, `competitive_profiles`, `rating_history`, `submissions`, `topic_scores`, `roadmaps`, `chat_sessions`, `chat_messages`, `code_reviews`, and `problem_catalog`. [Profile repositories](backend/app/repositories/profile_repository.py) own most feature queries. The [seed script](backend/app/seed/run.py) inserts a demo user and starter problem catalog.

## API keys and configuration

No live API key can be derived from this repository. Copy [.env.example](.env.example) to `.env` and set values obtained or generated for **your** deployment. Do not commit `.env`; it is covered by [.gitignore](.gitignore).

| Variable | What to provide | Needed for |
| --- | --- | --- |
| `GEMINI_API_KEY` | A key created in your Google AI project | Live Gemini tutor and code review; optional because the code has fallback responses |
| `JWT_SECRET_KEY` | A unique, long cryptographically random secret that you generate | Signing and verifying access and refresh JWTs |
| `POSTGRES_PASSWORD` | A unique database password that you choose | Docker PostgreSQL container |
| `POSTGRES_USER`, `POSTGRES_DB` | Database account and database names that you choose | Docker PostgreSQL container |
| `DATABASE_URL` | Async PostgreSQL URL with the same database credentials | Backend database connection; Compose builds this URL for its backend container |
| `REDIS_URL` | Redis connection URL | Refresh-token denylist; Compose sets its internal URL |
| `BACKEND_CORS_ORIGINS` | Comma-separated frontend origins | Browser access to the API |
| `NEXT_PUBLIC_API_URL` | Browser-reachable `/api/v1` URL | Frontend API client; public configuration, not a secret |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `ENVIRONMENT` | Configuration values, not API keys | Token behavior and environment label |

Codeforces and LeetCode need **no API key for the endpoints this project currently calls**. Their base URLs are in [platform_clients.py](backend/app/external/platform_clients.py). Redis and PostgreSQL use connection credentials, not third-party API keys.

To generate a JWT signing secret locally, run `python -c "import secrets; print(secrets.token_urlsafe(48))"` and place the result only in your local `.env` or deployment secret store. Set a separate database password. The example values in `.env.example` are placeholders for local development.

## Run locally

From the project root, create `.env` from `.env.example`, fill in your values, then run `docker compose up --build`. Open `http://localhost:3000` for the frontend and `http://localhost:8000/docs` for the API reference. Compose runs the Alembic migration and seed script before starting the API. The seed script creates the published demo account, so disable or change that behavior before exposing the app publicly.

The diagrams were authored from files in this local workspace. This directory has no Git metadata, so the HTML diagrams do not contain a pinned repository revision or verifiable source links; the source links in this document point to the inspected workspace files.
