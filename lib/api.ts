import { Router, Request, Response } from 'express';
import { db } from './db';
import { scheduleTaskTimer, clearTaskTimer } from './queue';
import { getIO } from './socket';

export const apiRouter = Router();

apiRouter.get('/system/state', async (req: Request, res: Response) => {
  try {
    const state = await db.getState();
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

apiRouter.post('/system/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    const updates = {
      mode,
      suppressed_notifications: mode === "deep_focus"
    };
    const state = await db.updateState(updates);
    getIO().to('tasks').emit('state:updated');
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update mode' });
  }
});

apiRouter.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await db.getTasks();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

apiRouter.post('/tasks', async (req: Request, res: Response) => {
  try {
    const task = await db.createTask(req.body);
    getIO().to('tasks').emit('state:updated');
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

apiRouter.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const task = await db.updateTask(req.params.id as string, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    getIO().to('tasks').emit('state:updated');
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

apiRouter.post('/tasks/:id/start', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await db.getTask(id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    if (task.status === 'completed') {
      return res.status(400).json({ error: "Cannot start a completed task" });
    }
    
    if (task.status === 'running') {
      return res.status(400).json({ error: "Task is already running" });
    }

    const now = new Date().toISOString();
    const updated = await db.updateTask(id, { 
      status: "running",
      started_at: now
    });
    
    if (!updated) {
      return res.status(404).json({ error: "Failed to update task" });
    }
    
    await db.createSession(id);
    
    if (!task.is_infinite) {
      await scheduleTaskTimer(id, task.estimated_time || 5);
    }

    getIO().to('tasks').emit('state:updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start task' });
  }
});

apiRouter.post('/tasks/:id/pause', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await db.getTask(id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updated = await db.updateTask(id, { status: "paused" });
    
    if (!updated) {
      return res.status(404).json({ error: "Failed to update task" });
    }
    
    await clearTaskTimer(id);

    getIO().to('tasks').emit('state:updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to pause task' });
  }
});

apiRouter.post('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await db.getTask(id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const state = await db.getState();
    if (task.is_infinite && state.mode === 'deep_focus') {
      await db.updateState({ mode: "parallel", suppressed_notifications: false });
    }

    const activeSession = await db.getActiveSession(id);
    if (activeSession) {
      await db.completeSession(activeSession.id);
    }
    
    await clearTaskTimer(id);
    
    const updated = await db.updateTask(id, { 
      status: "completed"
    });
    
    if (!updated) {
      return res.status(500).json({ error: "Failed to update task" });
    }
    
    getIO().to('tasks').emit('state:updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

apiRouter.post('/tasks/:id/extend', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await db.getTask(id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.is_infinite) {
      return res.status(400).json({ error: "Cannot extend an infinite task" });
    }

    const extensions = task.extension_count + 1;

    const updated = await db.updateTask(id, { 
      extension_count: extensions,
      status: "running" 
    });
    
    await scheduleTaskTimer(id, 5);
    
    getIO().to('tasks').emit('state:updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extend task' });
  }
});

apiRouter.post('/tasks/:id/infinite', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await db.getTask(id);
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updated = await db.updateTask(id, { is_infinite: true });
    
    await db.updateState({ mode: "deep_focus", suppressed_notifications: true });
    await clearTaskTimer(id);
    
    getIO().to('tasks').emit('state:updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to make task infinite' });
  }
});

apiRouter.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await db.getSessions();
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

apiRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});