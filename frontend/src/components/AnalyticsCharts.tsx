import React, { useState } from 'react';
import { OverviewAnalytics, DailyAnalytics, StreakResponse, Habit, Todo, ActivityLog } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { Flame, CheckSquare, Clock, TrendingUp, Award, Activity, BarChart3, Zap, Filter, CheckCircle2 } from 'lucide-react';

interface AnalyticsChartsProps {
  overview: OverviewAnalytics | null;
  daily: DailyAnalytics[];
  streak: StreakResponse | null;
  habits: Habit[];
  todos: Todo[];
  logs?: ActivityLog[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  overview,
  daily,
  streak,
  habits,
  todos,
  logs = []
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || '');

  // Format daily data for Recharts
  const chartData = daily.map((d) => {
    const formattedDate = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return {
      date: formattedDate,
      minutes: d.total_minutes,
      logs: d.log_count,
      avgScore: d.average_score,
      weightedScore: d.total_weighted_score
    };
  });

  // Calculate Habit Score Trend (mind multipliers)
  const currentSelectedHabit = habits.find((h) => h.id === selectedHabitId) || habits[0];
  const habitLogs = currentSelectedHabit
    ? logs
        .filter((l) => l.type === 'HABIT' && l.habit_id === currentSelectedHabit.id)
        .sort((a, b) => a.activity_date.localeCompare(b.activity_date))
    : [];

  const habitTrendData = habitLogs.map((log) => {
    const mult = log.multiplier || 1;
    const weightedScore = log.score * mult;
    const formattedDate = new Date(log.activity_date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return {
      date: formattedDate,
      rawScore: log.score,
      multiplier: mult,
      weightedScore: weightedScore,
      duration: log.duration_minutes || 0
    };
  });

  // Habit completion rate data
  const habitCompletionData = habits.map((h) => ({
    name: h.title.length > 15 ? h.title.substring(0, 15) + '...' : h.title,
    fullTitle: h.title,
    completionRate: h.scheduled_days > 0 ? Math.round((h.completed_days / h.scheduled_days) * 100) : h.progress_score || 0
  }));

  // Todo completion rate data
  const todoCompletionData = todos.map((t) => ({
    name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
    fullTitle: t.title,
    completionRate: t.scheduled_count > 0 ? Math.round((t.completed_count / t.scheduled_count) * 100) : t.progress_score || 0
  }));

  return (
    <div className="space-y-6 pt-4">
      {/* Section Header */}
      <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
        <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white">Performance & Matrix Analytics</h2>
          <p className="text-xs text-slate-400">Comprehensive historical trends, streak statistics, and score metrics</p>
        </div>
      </div>

      {/* OVERVIEW METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Habits & Todos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracked Items</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{habits.length + todos.length}</span>
            <span className="text-xs text-slate-400">Items Total</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>{habits.length} Habits</span>
            </span>
            <span className="text-purple-400 font-medium flex items-center space-x-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{todos.length} Todos</span>
            </span>
          </div>
        </div>

        {/* Card 2: Current & Longest Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Streak</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-400">{streak?.current_streak || 0}</span>
            <span className="text-xs font-bold text-amber-400 uppercase">Days Fire 🔥</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Longest Streak:</span>
            <span className="font-bold text-slate-200">{streak?.longest_streak || 0} Days</span>
          </div>
        </div>

        {/* Card 3: Total Minutes & Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time & Logs</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white">{overview?.total_minutes_logged || 0}</span>
            <span className="text-xs text-slate-400">Mins Logged</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Activity Logs:</span>
            <span className="font-bold text-emerald-400">{overview?.total_activity_logs || 0}</span>
          </div>
        </div>

        {/* Card 4: Overall Progress Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress Score</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-indigo-400">
              {overview?.overall_progress || 0}%
            </span>
            <span className="text-xs text-slate-400">Completion</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Avg Quality Score:</span>
            <span className="font-bold text-amber-400">{overview?.overall_average_score || 0}/10</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Minutes Spent Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Daily Minutes Spent Trend</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Total duration logged per day (minutes)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Area type="monotone" dataKey="minutes" name="Minutes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Activity Score & Log Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Daily Average Score & Log Count</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Quality score (1-10) and total logged events</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avgScore" name="Avg Score (1-10)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="logs" name="Log Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW INTERACTIVE SECTION: HABIT SCORE TREND WITH DROPDOWN (MIND MULTIPLIERS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Habit Score Trend (Weighted by Multipliers)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a habit to view how its score (Score × Multiplier) evolves across logs
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedHabitId || currentSelectedHabit?.id || ''}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} ({h.importance_score}/10)
                </option>
              ))}
            </select>
          </div>
        </div>

        {habitTrendData.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800">
            No activity logs recorded yet for {currentSelectedHabit?.title || 'selected habit'}.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={habitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeightedScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Weighted Score') return [`${value} pts (Score × Multiplier)`, name];
                    return [value, name];
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="weightedScore"
                  name="Weighted Score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWeightedScore)"
                />
                <Bar dataKey="rawScore" name="Base Score (1-10)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* NEW SECTION: HABITS & TODOS COMPLETION RATE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Completion Rate Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Habit Rate of Completion (%)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Percentage of scheduled days completed per habit</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitCompletionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                  labelFormatter={(name: string, items: any[]) => items[0]?.payload?.fullTitle || name}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Todo Completion Rate Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                <span>Todo Rate of Completion (%)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Percentage of scheduled occurrences completed per todo</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={todoCompletionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                  labelFormatter={(name: string, items: any[]) => items[0]?.payload?.fullTitle || name}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ITEM LEADERBOARD & STREAKS BREAKDOWN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Habit & Todo Item Leaderboard</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Habits Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Habit Completion & Progress</span>
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {habits.map((h) => (
                <div key={h.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-100">{h.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Completed: {h.completed_days} / {h.scheduled_days} Days
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold rounded text-[11px]">
                      {h.progress_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Todos Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Todo Occurrences & Completion</span>
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {todos.map((t) => (
                <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-100">{t.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Scheduled: {t.completed_count} / {t.scheduled_count} Done
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-extrabold rounded text-[11px]">
                      {t.progress_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
