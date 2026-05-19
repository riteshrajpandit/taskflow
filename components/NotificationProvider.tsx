"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useDataStore } from "@/store/useDataStore";

const ENGAGE_SOUND = "/audios/engage_music.mp3";
const VIBE_SOUND = "/audios/vibe_music.mp3";

export function NotificationProvider() {
  const [checkpointTask, setCheckpointTask] = useState<{taskId: string, title: string} | null>(null);
  const [toasts, setToasts] = useState<{id: string, title: string}[]>([]);
  const { completeTask, extendTask, makeTaskInfinite, systemState } = useDataStore();
  
  const engageAudioRef = useRef<HTMLAudioElement | null>(null);
  const vibeAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundType: 'engage' | 'vibe') => {
    if (systemState.suppressed_notifications) return;
    
    if (soundType === 'engage' && !engageAudioRef.current) {
      engageAudioRef.current = new Audio(ENGAGE_SOUND);
      engageAudioRef.current.volume = 0.7;
    }
    if (soundType === 'vibe' && !vibeAudioRef.current) {
      vibeAudioRef.current = new Audio(VIBE_SOUND);
      vibeAudioRef.current.volume = 0.5;
    }
    
    const audio = soundType === 'engage' ? engageAudioRef.current : vibeAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [systemState.suppressed_notifications]);

  useEffect(() => {
    const handleCheckpoint = (e: any) => {
      playSound('engage');
      setCheckpointTask(e.detail);
    };
    
    const handleCompleted = (e: any) => {
      if (systemState.suppressed_notifications) return;
      playSound('vibe');
      const newToast = { id: Math.random().toString(), title: e.detail.title };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('task-checkpoint', handleCheckpoint);
    window.addEventListener('task-completed', handleCompleted);

    return () => {
      window.removeEventListener('task-checkpoint', handleCheckpoint);
      window.removeEventListener('task-completed', handleCompleted);
    };
  }, [playSound, systemState.suppressed_notifications]);

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="px-4 py-3 rounded-lg shadow-xl flex items-center justify-between animate-in slide-in-from-right-4"
            style={{ 
              background: 'var(--matcha)', 
              color: 'white',
              border: '1px solid var(--matcha)'
            }}
          >
            <span className="font-medium text-sm">
              <span className="mr-2">✓</span>
              Completed: {toast.title}
            </span>
          </div>
        ))}
      </div>

      {/* Checkpoint Modal */}
      {checkpointTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="rounded-2xl shadow-2xl max-w-sm w-full p-6 border animate-in zoom-in-95"
            style={{ 
              background: 'var(--washi)',
              borderColor: 'var(--indigo-soft)'
            }}
          >
            <div className="text-center mb-4">
              <div 
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                style={{ background: 'var(--indigo-pale)' }}
              >
                <span className="text-3xl" style={{ color: 'var(--indigo)' }}>◦</span>
              </div>
              <h3 className="text-xl font-serif mb-2" style={{ color: 'var(--ink)' }}>
                Time&apos;s up!
              </h3>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                Did you finish <span className="font-semibold">&quot;{checkpointTask.title}&quot;</span>?
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  completeTask(checkpointTask.taskId);
                  setCheckpointTask(null);
                }}
                className="zen-btn zen-btn-success w-full py-3"
              >
                <span className="mr-2">✓</span> Yes, mark as completed
              </button>
              
              <button 
                onClick={() => {
                  extendTask(checkpointTask.taskId);
                  setCheckpointTask(null);
                }}
                className="zen-btn zen-btn-secondary w-full py-3"
              >
                <span className="mr-1">+</span> No, need more time (+5m)
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button 
                onClick={() => {
                  makeTaskInfinite(checkpointTask.taskId);
                  setCheckpointTask(null);
                }}
                className="w-full text-center text-sm py-2 rounded-lg transition-colors"
                style={{ color: 'var(--ink-faint)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--indigo)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--ink-faint)'}
              >
                ∞ Enter Deep Focus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}