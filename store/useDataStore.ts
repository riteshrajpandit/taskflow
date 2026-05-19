import { create } from 'zustand';
import { Task, SystemState } from '../lib/db';
import { api, Stats } from '../services/api';

interface DataStore {
  tasks: Task[];
  systemState: SystemState;
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  
  fetchInitialData: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  extendTask: (id: string) => Promise<void>;
  makeTaskInfinite: (id: string) => Promise<void>;
  setSystemMode: (mode: "parallel" | "deep_focus") => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  tasks: [],
  systemState: {
    current_active_task_id: null,
    mode: "parallel",
    suppressed_notifications: false
  },
  stats: null,
  loading: true,
  error: null,

  fetchInitialData: async () => {
    try {
      set({ loading: true, error: null });
      const [tasks, state] = await Promise.all([
        api.getTasks(),
        api.getSystemState()
      ]);
      set({ tasks, systemState: state, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch data';
      set({ loading: false, error: message });
      console.error("Failed to fetch initial data", e);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.getStats();
      set({ stats });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  },

  createTask: async (data) => {
    try {
      await api.createTask(data);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to create task", e);
      throw e;
    }
  },

  startTask: async (id) => {
    try {
      await api.startTask(id);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to start task", e);
      throw e;
    }
  },

  pauseTask: async (id) => {
    try {
      await api.pauseTask(id);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to pause task", e);
      throw e;
    }
  },

  completeTask: async (id) => {
    try {
      await api.completeTask(id);
      await get().fetchInitialData();
      await get().fetchStats();
    } catch (e) {
      console.error("Failed to complete task", e);
      throw e;
    }
  },

  extendTask: async (id) => {
    try {
      await api.extendTask(id);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to extend task", e);
      throw e;
    }
  },

  makeTaskInfinite: async (id) => {
    try {
      await api.makeTaskInfinite(id);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to make task infinite", e);
      throw e;
    }
  },

  setSystemMode: async (mode) => {
    try {
      await api.setSystemMode(mode);
      await get().fetchInitialData();
    } catch (e) {
      console.error("Failed to set system mode", e);
      throw e;
    }
  }
}));
