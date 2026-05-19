"use client";

import { useState, useEffect } from 'react';

export function Timer({ 
  startTime, 
  estimatedMinutes, 
  isRunning, 
  isInfinite 
}: { 
  startTime: string; 
  estimatedMinutes: number; 
  isRunning: boolean;
  isInfinite: boolean;
}) {
  const [elapsed, setElapsed] = useState(() => {
    if (!startTime || !isRunning) return 0;
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  });

  useEffect(() => {
    if (!isRunning || !startTime) return;
    
    const start = new Date(startTime).getTime();
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  if (isInfinite) {
    return (
      <div className="font-mono text-base tracking-tight font-medium" style={{ color: 'var(--indigo)' }}>
        ∞ Deep Focus
      </div>
    );
  }

  const estimatedSeconds = estimatedMinutes * 60;
  const remaining = Math.max(0, estimatedSeconds - elapsed);
  
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');

  const isOvertime = remaining === 0 && isRunning;
  
  return (
    <div className={`font-mono text-base tracking-tight font-medium ${isOvertime ? 'animate-pulse' : ''}`} style={{ color: isOvertime ? 'var(--vermilion)' : 'var(--ink-soft)' }}>
      {isOvertime ? '-' : ''}{m}:{s}
    </div>
  );
}