import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { db } from './db';
import { getIO } from './socket';

const REDIS_URL = process.env.REDIS_URL;

let redisClient: Redis | null = null;
let timerWorker: Worker | null = null;

const fallbackTimers: Record<string, NodeJS.Timeout> = {};

function getRedisClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redisClient;
}

function getTimerQueue(): Queue | null {
  const client = getRedisClient();
  if (!client) return null;
  return new Queue('timers', { connection: client });
}

export async function scheduleTaskTimer(taskId: string, durationMinutes: number) {
  const durationMs = durationMinutes * 60 * 1000;
  
  const queue = getTimerQueue();
  if (queue) {
    await queue.add('task_end', { taskId }, { delay: durationMs, jobId: taskId });
  } else {
    // Fallback: use setTimeout
    if (fallbackTimers[taskId]) clearTimeout(fallbackTimers[taskId]);
    
    // Default to a smaller realistic time for demo (1 min = 10 sec in demo)
    const demoMs = durationMinutes * 10000; 

    fallbackTimers[taskId] = setTimeout(async () => {
      await handleTimerEnd(taskId);
      delete fallbackTimers[taskId];
    }, durationMs > 0 ? demoMs : 5000); // Demoware duration
  }
}

export async function clearTaskTimer(taskId: string) {
  const queue = getTimerQueue();
  if (queue) {
    await queue.remove(jobIdToJobKey(taskId));
  } else {
    if (fallbackTimers[taskId]) {
      clearTimeout(fallbackTimers[taskId]);
      delete fallbackTimers[taskId];
    }
  }
}

function jobIdToJobKey(jobId: string): string {
  return `bull:timers:${jobId}`;
}

// Logic triggered when the timer ends
export async function handleTimerEnd(taskId: string) {
  const task = await db.getTask(taskId);
  if (!task || task.status !== "running") return;

  if (task.type === "active") {
    // Ask 'Did you finish?' -> Trigger checkpoint
    getIO().to('tasks').emit('task:checkpoint', { taskId, title: task.title });
  } else if (task.type === "async") {
    // Async completes automatically
    await db.updateTask(taskId, { status: "completed" });
    const state = await db.getState();
    if (!state.suppressed_notifications) {
      getIO().to('tasks').emit('task:completed', { taskId, title: task.title });
    }
  }
  
  // Provide generic refresh ping
  getIO().to('tasks').emit('state:updated');
}

// Initialize worker if using Redis
export function initTimerWorker(): void {
  const client = getRedisClient();
  if (!client || timerWorker) return;

  timerWorker = new Worker('timers', async job => {
    if (job.name === 'task_end') {
      await handleTimerEnd(job.data.taskId);
    }
  }, { connection: client });
  
  timerWorker.on('failed', (job, err) => {
    console.error(`Task ${job?.id} failed with ${err.message}`);
  });
}

export async function closeTimerWorker(): Promise<void> {
  if (timerWorker) {
    await timerWorker.close();
    timerWorker = null;
  }
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
