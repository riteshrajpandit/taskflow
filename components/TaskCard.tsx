"use client";

import { memo } from 'react';
import { Task } from '@/lib/db';
import { useDataStore } from '@/store/useDataStore';
import { Timer } from './Timer';
import { Play, Square, CheckCircle2, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  activeFocus?: boolean;
}

const TaskCardComponent = ({ task, activeFocus = false }: TaskCardProps) => {
  const startTask = useDataStore(state => state.startTask);
  const pauseTask = useDataStore(state => state.pauseTask);
  const completeTask = useDataStore(state => state.completeTask);
  const extendTask = useDataStore(state => state.extendTask);
  const makeTaskInfinite = useDataStore(state => state.makeTaskInfinite);

  const isRunning = task.status === 'running';
  const isDone = task.status === 'completed';

  const getCardClass = () => {
    if (isRunning) return 'zen-card zen-card-active';
    if (isDone) return 'zen-card zen-card-done';
    return 'zen-card';
  };

  const getBadgeClass = () => {
    if (isDone) return 'zen-badge zen-badge-completed';
    if (isRunning) return 'zen-badge zen-badge-running';
    return 'zen-badge zen-badge-pending';
  };

  return (
    <div className={getCardClass()}>
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.type === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              {task.type}
            </span>
            <h3 className="font-medium text-sm" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={getBadgeClass()}>
              {isDone ? 'Done' : isRunning ? (task.is_infinite ? '∞ Infinite' : 'Running') : 'Pending'}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
              <Clock className="w-3 h-3" />
              {task.estimated_time}m
            </span>
            {task.extension_count > 0 && (
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                +{task.extension_count * 5}m
              </span>
            )}
          </div>
        </div>

        {isRunning && (
          <div className="px-3 py-2 rounded" style={{ background: 'var(--indigo-pale)' }}>
            <Timer 
              startTime={task.started_at || task.created_at}
              estimatedMinutes={task.estimated_time + (task.extension_count * 5)}
              isRunning={isRunning}
              isInfinite={task.is_infinite}
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {task.status === 'pending' || task.status === 'paused' ? (
          <button 
            onClick={() => startTask(task.id)}
            className="zen-btn zen-btn-secondary text-xs px-3 py-2"
            aria-label="Start task"
          >
            <Play className="w-3 h-3 inline mr-1" /> Start
          </button>
        ) : isRunning ? (
          <>
            <button 
              onClick={() => pauseTask(task.id)}
              className="zen-btn zen-btn-secondary text-xs px-3 py-2"
              aria-label="Pause task"
            >
              <Square className="w-3 h-3 inline fill-current mr-1" /> Pause
            </button>
            {!task.is_infinite && (
              <button 
                onClick={() => extendTask(task.id)}
                className="zen-btn zen-btn-secondary text-xs px-3 py-2"
                title="Add 5 more minutes"
              >
                +5m
              </button>
            )}
            <button 
              onClick={() => completeTask(task.id)}
              className="zen-btn zen-btn-success text-xs px-3 py-2 ml-auto"
              aria-label="Mark task as done"
            >
              <CheckCircle2 className="w-3 h-3 inline mr-1" /> Done
            </button>
          </>
        ) : (
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--matcha)' }}>
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        )}
      </div>
    </div>
  );
};

export const TaskCard = memo(TaskCardComponent);