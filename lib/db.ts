import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export const prisma = new PrismaClient();

let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
}

const STATE_CACHE_KEY = 'system_state';
const STATE_CACHE_TTL = 60;

export type TaskType = "async" | "active";
export type TaskStatus = "pending" | "running" | "paused" | "completed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  estimated_time: number;
  actual_time: number;
  is_infinite: boolean;
  extension_count: number;
  started_at: string | null;
  created_at: string;
}

export interface SystemState {
  id?: number;
  current_active_task_id: string | null;
  mode: string;
  suppressed_notifications: boolean;
}

export interface Session {
  id: string;
  task_id: string;
  start_time: Date | string;
  end_time: Date | string | null;
  duration: number;
}

async function getCachedState(): Promise<SystemState | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get(STATE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCachedState(state: SystemState): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(STATE_CACHE_KEY, STATE_CACHE_TTL, JSON.stringify(state));
  } catch {
    // Redis write failed, continue without caching
  }
}

async function invalidateStateCache(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(STATE_CACHE_KEY);
  } catch {
    // Redis delete failed, continue
  }
}

// Database operations using Prisma
export const db = {
  async init() {
    await prisma.$connect();
    console.log("Prisma connected to PostgreSQL");
    
    // Ensure system state exists
    const state = await prisma.systemState.findFirst();
    if (!state) {
      await prisma.systemState.create({
        data: {
          mode: "parallel",
          suppressed_notifications: false
        }
      });
    }
  },

  async getTasks() {
    const tasks = await prisma.task.findMany({
      orderBy: { created_at: 'desc' }
    });
    return tasks.map(t => ({
      ...t,
      estimated_time: t.estimated_time || 0,
      actual_time: t.actual_time || 0,
      is_infinite: t.is_infinite || false,
      extension_count: t.extension_count || 0
    }));
  },

  async getTask(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;
    return {
      ...task,
      estimated_time: task.estimated_time || 0,
      actual_time: task.actual_time || 0
    };
  },

  async createTask(data: Partial<Task>) {
    const task = await prisma.task.create({
      data: {
        title: data.title || "Untitled",
        description: data.description || "",
        type: data.type || "active",
        status: "pending",
        estimated_time: data.estimated_time || 25,
        actual_time: 0,
        is_infinite: false,
        extension_count: 0,
        started_at: null
      }
    });
    return task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const updateData: any = { ...updates };
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.sessions;
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });
    return task;
  },

  async getState() {
    const cached = await getCachedState();
    if (cached) return cached;

    const state = await prisma.systemState.findFirst();
    if (!state) {
      const newState = await prisma.systemState.create({
        data: {
          mode: "parallel",
          suppressed_notifications: false
        }
      });
      await setCachedState(newState);
      return newState;
    }
    await setCachedState(state);
    return state;
  },

  async updateState(updates: Partial<SystemState>) {
    await invalidateStateCache();
    const state = await prisma.systemState.findFirst();
    if (!state) {
      return this.getState();
    }
    const updated = await prisma.systemState.update({
      where: { id: state.id },
      data: updates
    });
    await setCachedState(updated);
    return updated;
  },

  async createSession(taskId: string) {
    return await prisma.session.create({
      data: {
        task_id: taskId,
        start_time: new Date(),
        end_time: null,
        duration: 0
      }
    });
  },

  async completeSession(sessionId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return null;
    
    const endTime = new Date();
    const startTime = new Date(session.start_time);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000 * 100) / 100;
    
    return await prisma.session.update({
      where: { id: sessionId },
      data: {
        end_time: endTime,
        duration: durationMinutes
      }
    });
  },

  async getSessions(taskId?: string) {
    if (taskId) {
      return await prisma.session.findMany({
        where: { task_id: taskId },
        orderBy: { start_time: 'desc' }
      });
    }
    return await prisma.session.findMany({
      orderBy: { start_time: 'desc' }
    });
  },

  async getActiveSession(taskId: string) {
    return await prisma.session.findFirst({
      where: {
        task_id: taskId,
        end_time: null
      }
    });
  },

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completedCount, totalMinutesResult, todaySessionsResult, recentSessions] = await Promise.all([
      prisma.task.count({ where: { status: 'completed' } }),
      prisma.session.aggregate({ _sum: { duration: true } }),
      prisma.session.aggregate({
        where: { start_time: { gte: today } },
        _count: true,
        _sum: { duration: true }
      }),
      prisma.session.findMany({
        select: { start_time: true },
        orderBy: { start_time: 'desc' },
        take: 100
      })
    ]);

    return {
      total_tasks_completed: completedCount,
      total_minutes: totalMinutesResult._sum.duration || 0,
      today_tasks: todaySessionsResult._count,
      today_minutes: todaySessionsResult._sum.duration || 0,
      streak: this.calculateStreak(recentSessions)
    };
  },

  calculateStreak(sessions: { start_time: Date | string }[]): number {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map(s => new Date(s.start_time).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date().toDateString();
    const expected = new Date();
    
    for (const date of dates) {
      if (date.toDateString() === expected.toDateString() || (streak === 0 && date.toDateString() === today)) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }
};