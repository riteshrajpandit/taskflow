# Adaptive Task Orchestrator

Human + AI task execution system with parallel async tasks and sequential focus tasks.

## Architecture

- **Server**: `server.ts` (Express + Socket.io + Next.js custom server)
  - Do NOT use `next start`; start with `node server.ts`
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend API**: Express router at `/api` (see `lib/api.ts`)
- **Real-time**: Socket.io with room `tasks` (see `lib/socket.ts`)
- **State**: Zustand store (`store/useDataStore.ts`)

## Task System

Two task types:
- `active` - Human focus task (single concurrent active task)
- `async` - Background AI task (multiple concurrent)

Two modes:
- `parallel` - Normal multi-task mode
- `deep_focus` - Single-task focus mode (auto-triggered after 2 extensions)

Timer logic in `lib/queue.ts`: active tasks emit `task:checkpoint` when timer ends; async tasks auto-complete.

## Backend Architecture

**Entry point**: `server.ts` creates HTTP server, mounts Socket.io, Express API, and Next.js handler.

**Database** (`lib/db.ts`):
- PostgreSQL if `DATABASE_URL` is set
- Memory fallback if not set (dev mode)

**Queues** (`lib/queue.ts`):
- BullMQ + Redis if `REDIS_URL` is set
- `setTimeout` fallback if not set
- **Demo mode**: 1 minute = 10 seconds (not real time)

## Session Tracking

Sessions track actual work time per task:
- Session created on task start (`/tasks/:id/start`)
- Session completed and duration calculated on task completion (`/tasks/:id/complete`)
- Actual time stored on task record

## Statistics

Stats API at `/stats` returns:
- `total_tasks_completed`: Lifetime completed tasks
- `total_minutes`: Total tracked time
- `today_tasks`: Tasks completed today
- `today_minutes`: Time tracked today
- `streak`: Consecutive days with tracked sessions

## Key Commands

```bash
npm run dev    # Start server (tsx server.ts)
npm run build  # Next.js build
npm run lint   # ESLint
```

## AI Studio Deployment

- `GEMINI_API_KEY` and `APP_URL` are auto-injected by AI Studio
- `DISABLE_HMR=true` disables hot reload (AI Studio env)
- `next.config.ts` disables file watching when `DISABLE_HMR=true`
- Output: `standalone` (Docker-friendly)