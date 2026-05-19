"use client";

import { useEffect, useState } from 'react';
import { api, Stats as StatsType } from '@/services/api';
import { Trophy, Clock, Calendar, Flame } from 'lucide-react';

export function StatsView() {
  const [stats, setStats] = useState<StatsType | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  const statCards = stats ? [
    {
      icon: Trophy,
      label: 'Completed',
      value: stats.total_tasks_completed,
      bg: 'var(--matcha-pale)',
      color: 'var(--matcha)'
    },
    {
      icon: Clock,
      label: 'Total Time',
      value: `${Math.round(stats.total_minutes)}m`,
      bg: 'var(--indigo-pale)',
      color: 'var(--indigo)'
    },
    {
      icon: Calendar,
      label: 'Today',
      value: `${stats.today_tasks} tasks`,
      bg: 'var(--rice-deep)',
      color: 'var(--ink-soft)'
    },
    {
      icon: Flame,
      label: 'Streak',
      value: `${stats.streak} days`,
      bg: 'var(--vermilion-pale)',
      color: 'var(--vermilion)'
    }
  ] : [];

  return (
    <div className="zen-card">
      <div className="zen-section-title mb-4">Statistics</div>
      {stats ? (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded p-3" style={{ background: stat.bg }}>
              <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
              <div className="text-lg font-semibold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm" style={{ color: 'var(--ink-faint)' }}>Loading...</div>
      )}
    </div>
  );
}