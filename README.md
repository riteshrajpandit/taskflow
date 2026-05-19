<div align="center">
<img width="1200" height="475" alt="Task Flow" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Task Flow

A **parallel task execution app** for human + AI workflows. Track your focused work sessions, run multiple tasks simultaneously, and let AI handle background tasks automatically.

## Use Case

You're working on a complex project with multiple things happening at once:

- **Some tasks need your full attention** (Active tasks) - they run on a timer with checkpoints
- **Other tasks can run in the background** (Async tasks) - AI handles them, you get notified when done
- **Deep Focus mode** - when you need uninterrupted time, all notifications pause

### Example Workflow

```
You have 3 tasks to complete:
1. "Write project proposal" (Active, 25 min) - Your focused work
2. "Research competitor pricing" (Async, 15 min) - AI research in background
3. "Review pull requests" (Active, 10 min) - Your focused work

All 3 can run in parallel. When:
- Timer ends on "Write project proposal" → Checkpoint modal asks: Done? +5m? Deep Focus?
- AI finishes "Research competitor pricing" → Toast notification with results
- "Review pull requests" completes → Marked as done
```

## Features

| Feature | Description |
|---------|-------------|
| **Parallel Execution** | Run multiple tasks simultaneously |
| **Active Tasks** | Your focused work with timed checkpoints |
| **Async Tasks** | Background AI tasks that auto-complete |
| **Session Tracking** | Track actual time spent on each task |
| **Statistics** | Total completed, time tracked, daily streak |
| **Deep Focus** | Pause all notifications for uninterrupted work |
| **Sound Notifications** | Audio cues for task completion |

## Quick Start

**Prerequisites:** Node.js, PostgreSQL (optional), Redis (optional)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment** (create `.env`):
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/paralleltracker
   REDIS_URL=redis://localhost:6379
   ```
   - `DATABASE_URL` - PostgreSQL (falls back to in-memory if not set)
   - `REDIS_URL` - Redis for BullMQ queues (falls back to setTimeout if not set)

3. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Task Types

### Active Tasks
- Require your focused attention
- Run on a timer (default 25 minutes)
- When timer ends → Checkpoint modal appears
  - **Mark as completed** - Task is done
  - **Add +5 minutes** - Need more time
  - **Deep Focus** - Infinite timer, suppress all notifications
- Play `engage_music.mp3` sound on checkpoint

### Async Tasks
- Run in the background
- Auto-complete when timer ends
- Show toast notification when done
- Play `vibe_music.mp3` sound on completion

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   Express   │────▶│  PostgreSQL │
│  (Frontend) │     │   (API)     │     │   (Prisma)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │   BullMQ    │
       │            │   (Queue)   │
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  Socket.io  │────▶│    Redis    │
│   (Events)  │     │  (Timers)   │
└─────────────┘     └─────────────┘
```

## Key Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npx prisma studio # Open Prisma database GUI
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | No | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection for BullMQ |
| `GEMINI_API_KEY` | For AI features | Gemini API key |
| `APP_URL` | For AI Studio | Public app URL |

## View in AI Studio

https://ai.studio/apps/a3b67e5c-fb9e-4971-b180-3d460a27e13f
