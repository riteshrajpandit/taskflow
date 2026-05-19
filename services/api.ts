import type { Task, SystemState } from '../lib/db';
import type { Session } from '../lib/db';

const baseURL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseURL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  
  const text = await res.text();
  
  if (!res.ok) {
    let err;
    try {
      err = JSON.parse(text);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  
  if (!text) {
    throw new Error('Empty response from server');
  }
  
  return JSON.parse(text);
}

export interface Stats {
  total_tasks_completed: number;
  total_minutes: number;
  today_tasks: number;
  today_minutes: number;
  streak: number;
}

export const api = {
  getSystemState: () => request<SystemState>('/system/state'),
  setSystemMode: (mode: "parallel" | "deep_focus") => request<SystemState>('/system/mode', {
    method: 'POST', body: JSON.stringify({ mode })
  }),
  getTasks: () => request<Task[]>('/tasks'),
  createTask: (data: Partial<Task>) => request<Task>('/tasks', {
    method: 'POST', body: JSON.stringify(data)
  }),
  updateTask: (id: string, updates: Partial<Task>) => request<Task>(`/tasks/${id}`, {
    method: 'PATCH', body: JSON.stringify(updates)
  }),
  startTask: (id: string) => request<Task>(`/tasks/${id}/start`, { method: 'POST' }),
  pauseTask: (id: string) => request<Task>(`/tasks/${id}/pause`, { method: 'POST' }),
  completeTask: (id: string) => request<Task>(`/tasks/${id}/complete`, { method: 'POST' }),
  extendTask: (id: string) => request<Task>(`/tasks/${id}/extend`, { method: 'POST' }),
  makeTaskInfinite: (id: string) => request<Task>(`/tasks/${id}/infinite`, { method: 'POST' }),
  getSessions: () => request<Session[]>('/sessions'),
  getStats: () => request<Stats>('/stats'),
};