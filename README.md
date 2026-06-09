# AlgoMentor AI

AI-Powered Competitive Programming Intelligence Platform.

## Features

- **Profile Analytics** — Sync Codeforces & LeetCode profiles
- **Topic Analysis** — Strength/weakness scores across 12 CP topics
- **Dashboard** — Rating charts, radar charts, activity feeds
- **Roadmap Generator** — AI-powered 4/8/12 week training plans
- **AI Tutor** — Chat interface powered by Gemini 2.5 Flash
- **Code Review** — Upload .cpp/.java/.py for AI analysis
- **Recommendations** — Personalized problem suggestions
- **Contest Predictor** — Rating forecasts
- **Interview Readiness** — Scores for top tech companies
- **Advanced Analytics** — Heatmaps, mastery curves, velocity metrics

## Tech Stack

- Next.js 15+ App Router, TypeScript, Tailwind CSS
- PostgreSQL + Prisma ORM
- Redis (Upstash) caching (24h TTL)
- Auth.js (NextAuth) with JWT sessions
- Gemini 2.5 Flash API
- Recharts for data visualization

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL
- (Optional) Upstash Redis, Gemini API key

### Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, AUTH_SECRET, etc.

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker compose up --build
```

Then run migrations inside the app container or locally:

```bash
npx prisma migrate deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:run     # Run tests once
npx prisma studio    # Database GUI
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── actions/          # Server Actions
├── components/       # UI components (ShadCN-style)
├── features/         # Feature-specific views
├── hooks/            # React hooks
├── lib/              # Core utilities (auth, prisma, redis, gemini)
├── services/         # Business logic & repositories
├── types/            # TypeScript types
└── utils/            # Helpers
prisma/
└── schema.prisma     # Database schema
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Use Vercel Postgres or external PostgreSQL
5. Run `npx prisma migrate deploy` via build command or separately

## License

MIT
