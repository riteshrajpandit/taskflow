"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { TaskCard } from '@/components/TaskCard';
import { StatsView } from '@/components/StatsView';
import { Plus, ChevronDown, Zap } from 'lucide-react';

export default function Dashboard() {
  const { tasks, systemState, createTask, loading, error, fetchInitialData, fetchStats } = useDataStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<"async" | "active">('active');
  const [newTaskTime, setNewTaskTime] = useState(25);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchInitialData();
    fetchStats();
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [fetchInitialData, fetchStats]);

  const handleCreate = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask({
      title: newTaskTitle,
      description: newTaskDesc || undefined,
      type: newTaskType,
      estimated_time: newTaskTime
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAdvanced(false);
  }, [newTaskTitle, newTaskDesc, newTaskType, newTaskTime, createTask]);

  const { runningTasks, pendingTasks, completedTasks, runningActive, runningAsync } = useMemo(() => {
    const running = tasks.filter(t => t.status === 'running');
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'paused');
    const completed = tasks.filter(t => t.status === 'completed');
    return {
      runningTasks: running,
      pendingTasks: pending,
      completedTasks: completed,
      runningActive: running.filter(t => t.type === 'active'),
      runningAsync: running.filter(t => t.type === 'async')
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--rice)' }}>
        <div className="text-center">
          <div className="text-4xl font-serif mb-3 animate-pulse-dot" style={{ color: 'var(--indigo)' }}>◦</div>
          <div className="text-sm tracking-widest uppercase" style={{ color: 'var(--ink-faint)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--rice)' }}>
        <div className="text-center p-8 rounded-lg" style={{ background: 'var(--washi)' }}>
          <div className="text-4xl font-serif mb-3" style={{ color: 'var(--vermilion)' }}>!</div>
          <div className="text-sm mb-4" style={{ color: 'var(--ink)' }}>Failed to load tasks. Please refresh.</div>
          <button 
            onClick={() => fetchInitialData()} 
            className="zen-btn zen-btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--rice)', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* Header */}
        <header className="flex items-end justify-between mb-10 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 className="text-2xl font-serif tracking-wide" style={{ color: 'var(--ink)' }}>
              Task Flow
            </h1>
            <p className="text-xs tracking-widest uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>
              Parallel task execution. Human + AI.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-serif tracking-wider" style={{ color: 'var(--ink-soft)' }}>
              {currentTime}
            </div>
            <div className="text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--ink-faint)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Add Task Bar */}
        <form onSubmit={handleCreate} className="mb-10">
          <div className="flex gap-3 items-center p-4 rounded-lg" style={{ background: 'var(--washi)' }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="zen-input flex-1"
            />
            
            {/* Type Dropdown */}
            <select
              value={newTaskType}
              onChange={(e) => setNewTaskType(e.target.value as "async" | "active")}
              className="zen-input w-28"
              aria-label="Task type"
            >
              <option value="active">Active</option>
              <option value="async">Async</option>
            </select>

            {/* Time */}
            <input
              type="number"
              value={newTaskTime || 25}
              onChange={(e) => setNewTaskTime(parseInt(e.target.value) || 25)}
              className="zen-input w-20 text-center"
              min="1"
              aria-label="Estimated time in minutes"
            />
            <span className="text-sm" style={{ color: 'var(--ink-faint)' }}>min</span>

            {/* Toggle advanced options */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="zen-btn zen-btn-secondary px-3"
              title="More options"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="zen-btn zen-btn-primary disabled:opacity-40"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add
            </button>
          </div>

          {/* Advanced: Description */}
          {showAdvanced && (
            <div className="mt-2 p-4 rounded-lg animate-fade-in" style={{ background: 'var(--washi)' }}>
              <textarea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                rows={2}
                className="zen-input w-full resize-none"
                placeholder="Add a description (optional)"
              />
            </div>
          )}
        </form>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Timeline Column */}
          <div className="flex-1">
            
            {/* Running Tasks */}
            {runningTasks.length > 0 && (
              <section className="mb-10">
                <div className="zen-section-title mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Running ({runningTasks.length})</span>
                </div>
                <div className="space-y-4">
                  {runningTasks.map(t => (
                    <div key={t.id} className="flex gap-0">
                      <div className="w-12 flex flex-col items-center pt-4">
                        {t.is_infinite ? (
                          <div className="w-3 h-3 rounded-full animate-pulse-dot" style={{ background: 'var(--indigo)' }}></div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ border: '1.5px solid var(--indigo-soft)', background: 'var(--rice)' }}></div>
                        )}
                        <div className="flex-1 w-px mt-2" style={{ background: 'var(--border)' }}></div>
                      </div>
                      <div className="flex-1">
                        <TaskCard task={t} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Tasks */}
            <section className="mb-10">
              <div className="zen-section-title mb-4">Pending ({pendingTasks.length})</div>
              <div className="space-y-3">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map(t => (
                    <div key={t.id} className="flex gap-0">
                      <div className="w-12 flex flex-col items-center pt-4">
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--ink-faint)' }}></div>
                      </div>
                      <div className="flex-1">
                        <TaskCard task={t} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm italic py-4 px-2" style={{ color: 'var(--ink-faint)' }}>
                    No pending tasks.
                  </div>
                )}
              </div>
            </section>

            {/* Completed */}
            {completedTasks.length > 0 && (
              <section>
                <div className="zen-section-title mb-4">Completed ({completedTasks.length})</div>
                <div className="space-y-2">
                  {completedTasks.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded" style={{ background: 'var(--rice-deep)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--matcha)' }}></div>
                        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{t.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--matcha-pale)', color: 'var(--matcha)' }}>
                          {t.type}
                        </span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'var(--ink-faint)' }}>{t.actual_time || t.estimated_time}m</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-8">
            
            {/* Stats */}
            <StatsView />

            {/* Mode Indicator */}
            <div className="text-center py-4 px-6 rounded-lg border"
              style={{
                background: systemState.mode === 'deep_focus' ? 'var(--indigo-pale)' : 'var(--rice-deep)',
                borderColor: systemState.mode === 'deep_focus' ? 'var(--indigo-soft)' : 'var(--border)',
              }}
            >
              <div className="text-lg font-serif tracking-wide" style={{ color: systemState.mode === 'deep_focus' ? 'var(--indigo)' : 'var(--ink-soft)' }}>
                {systemState.mode === 'deep_focus' ? '◦ Deep Focus' : '○ Parallel'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
                {systemState.mode === 'deep_focus' 
                  ? 'Infinite task running. Exit by completing.'
                  : `${runningTasks.length} task${runningTasks.length !== 1 ? 's' : ''} active`
                }
              </div>
            </div>

            {/* Task Legend */}
            <div className="zen-card">
              <div className="zen-section-title mb-3">Task Types</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--indigo)' }}></div>
                  <span style={{ color: 'var(--ink-soft)' }}>Active - You focus on this</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--matcha)' }}></div>
                  <span style={{ color: 'var(--ink-soft)' }}>Async - AI handles it</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--indigo)' }}></div>
                  <span style={{ color: 'var(--ink-soft)' }}>Infinite - No timer, manual exit</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}