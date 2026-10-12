# AlgoMentor AI

AI-powered Competitive Programming Coach that analyzes LeetCode and Codeforces profiles, identifies weaknesses, generates personalized roadmaps, reviews code, predicts ratings, and provides AI tutoring.

## Architecture

```
AlgoMentor/
├── backend/          # FastAPI + SQLAlchemy + Alembic
│   └── app/
│       ├── api/v1/       # REST endpoints
│       ├── core/         # Config, security, deps
│       ├── db/           # Database session
│       ├── external/     # Codeforces, LeetCode, Gemini
│       ├── ml/           # Rating prediction models
│       ├── models/       # SQLAlchemy models
│       ├── repositories/ # Data access layer
│       ├── schemas/      # Pydantic schemas
│       ├── services/     # Business logic
│       └── seed/         # Seed data
├── frontend/         # Next.js 15 App Router
│   ├── app/              # Pages and layouts
│   ├── components/       # UI and charts
│   └── lib/              # API client
├── docker-compose.yml
└── .env.example
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, ShadCN UI, Recharts, TanStack Query |
| Backend | FastAPI, Python 3.12, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT access + refresh tokens |
| AI | Google Gemini API |
| ML | scikit-learn (Ridge regression) |
| Deploy | Docker, Docker Compose |

## Features

1. **Authentication** — Register, login, refresh token, logout
2. **Profile Analytics** — Sync Codeforces & LeetCode (ratings, submissions, contests)
3. **Topic Analysis** — DP, Graphs, Trees, Greedy, Binary Search, Math, Strings, Implementation
4. **Dashboard** — Rating graph, topic radar, weakness heatmap, solved stats
5. **Roadmap Generator** — 4/8/12 week plans based on rating and weak topics
6. **AI Tutor** — Chat interface powered by Gemini
7. **AI Code Review** — Complexity, bugs, edge cases, optimizations
8. **Recommendations** — Easy/Medium/Hard problems by weak topics
9. **Contest Predictor** — ML rating forecasts (next contest, 3mo, 6mo)
10. **Interview Readiness** — Amazon, Google, Microsoft, Atlassian scores

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — set GEMINI_API_KEY for full AI features

# 2. Start all services
docker compose up --build

# 3. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Demo Account

```
Email: demo@algomentor.ai
Password: Demo1234!
```

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Start PostgreSQL and Redis locally, then:
cp ..\.env.example ..\.env

alembic upgrade head
python -m app.seed.run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/profiles/me` | Get profile |
| POST | `/api/v1/profiles/sync` | Sync CF/LC profiles |
| GET | `/api/v1/analytics/dashboard` | Dashboard data |
| POST | `/api/v1/roadmaps/generate` | Generate roadmap |
| GET | `/api/v1/roadmaps` | List roadmaps |
| POST | `/api/v1/tutor/sessions` | Create tutor session |
| POST | `/api/v1/tutor/sessions/{id}/messages` | Send message |
| POST | `/api/v1/code-review` | Review code |
| GET | `/api/v1/predictions/ratings` | Rating predictions |
| GET | `/api/v1/predictions/interview-readiness` | Interview scores |
| GET | `/api/v1/predictions/recommendations` | Problem recommendations |

## Database Schema

- `users` — User accounts
- `refresh_tokens` — JWT refresh token tracking
- `competitive_profiles` — Linked CF/LC profiles
- `rating_history` — Rating over time
- `submissions` — Solved/attempted problems
- `topic_scores` — Per-topic strength/weakness
- `roadmaps` — Generated study plans
- `chat_sessions` / `chat_messages` — AI tutor history
- `code_reviews` — Code review history
- `problem_catalog` — Recommendation problem pool

## License

MIT
