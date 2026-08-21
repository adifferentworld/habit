import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';
import { useTracker } from '../context/TrackerContext';
import { ChartDimension, TimeGranularity } from '../types';

const PASTEL_COLORS = [
  '#F43F5E', // Rose/Physics
  '#A855F7', // Lilac/Chem
  '#10B981', // Mint/Bio
  '#EC4899', // Pink/Practice
  '#F59E0B', // Amber/Care
  '#38BDF8', // Sky/Rev
  '#8B5CF6', // Violet
  '#FB7185', // Coral
];

export const ChartsPanel: React.FC = () => {
  const { habits, habitLogs, todoTemplates, todoInstances, tags, calculateHabitStreak } = useTracker();

  const [granularity, setGranularity] = useState<TimeGranularity>('weekly');
  const [dimension, setDimension] = useState<ChartDimension>('habit');

  // Generate date ranges for the selected granularity
  const timeBuckets = useMemo(() => {
    const buckets: { label: string; start: string; end: string }[] = [];
    const now = new Date();

    if (granularity === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        buckets.push({ label, start: dStr, end: dStr });
      }
    } else if (granularity === 'weekly') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const endD = new Date(now);
        endD.setDate(endD.getDate() - i * 7);
        const startD = new Date(endD);
        startD.setDate(startD.getDate() - 6);

        const startStr = startD.toISOString().split('T')[0];
        const endStr = endD.toISOString().split('T')[0];
        const label = `W-${4 - i} (${startD.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })})`;
        buckets.push({ label, start: startStr, end: endStr });
      }
    } else if (granularity === 'monthly') {
      // Last 4 months
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const startStr = d.toISOString().split('T')[0];
        const endStr = endD.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        buckets.push({ label, start: startStr, end: endStr });
      }
    } else {
      // Yearly
      for (let i = 2; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        buckets.push({ label: `${yr}`, start: `${yr}-01-01`, end: `${yr}-12-31` });
      }
    }

    return buckets;
  }, [granularity]);

  // 1. DATA: Per-Habit Completion Rate over time
  const habitCompletionData = useMemo(() => {
    return timeBuckets.map((bucket) => {
      const row: any = { period: bucket.label };

      habits.forEach((habit) => {
        const logsInBucket = habitLogs.filter(
          (l) => l.habitId === habit.id && l.date >= bucket.start && l.date <= bucket.end && l.completed
        );

        // Count expected days in bucket
        let scheduledDays = 0;
        let curr = new Date(bucket.start + 'T00:00:00');
        const end = new Date(bucket.end + 'T00:00:00');

        while (curr <= end) {
          const dayOfWeek = curr.getDay();
          if (habit.frequency === 'daily' || habit.daysOfWeek.includes(dayOfWeek)) {
            scheduledDays++;
          }
          curr.setDate(curr.getDate() + 1);
        }

        const rate = scheduledDays > 0 ? Math.round((logsInBucket.length / scheduledDays) * 100) : 0;
        row[habit.title.substring(0, 16)] = rate;
      });

      return row;
    });
  }, [timeBuckets, habits, habitLogs]);

  // 2. DATA: Per-Todo Completion Breakdown (Completed vs Pending)
  const todoCompletionData = useMemo(() => {
    return timeBuckets.map((bucket) => {
      const instancesInBucket = todoInstances.filter(
        (inst) => inst.date >= bucket.start && inst.date <= bucket.end
      );
      const completedCount = instancesInBucket.filter((i) => i.completed).length;
      const pendingCount = instancesInBucket.filter((i) => !i.completed).length;

      return {
        period: bucket.label,
        Completed: completedCount,
        Pending: pendingCount,
        Total: instancesInBucket.length,
      };
    });
  }, [timeBuckets, todoInstances]);

  // 3. DATA: Per-Tag Aggregated Progress
  const tagAggregatedData = useMemo(() => {
    return tags.map((tag, idx) => {
      // Find all habits with this tag
      const taggedHabits = habits.filter((h) => h.tagIds.includes(tag.id));
      const taggedHabitIds = new Set(taggedHabits.map((h) => h.id));
      const habitDoneCount = habitLogs.filter((l) => taggedHabitIds.has(l.habitId) && l.completed).length;

      // Find all todos with this tag
      const taggedTodos = todoTemplates.filter((t) => t.tagIds.includes(tag.id));
      const taggedTodoIds = new Set(taggedTodos.map((t) => t.id));
      const todoDoneCount = todoInstances.filter((i) => taggedTodoIds.has(i.todoTemplateId) && i.completed).length;

      const totalDone = habitDoneCount + todoDoneCount;

      return {
        name: tag.name,
        color: tag.color || PASTEL_COLORS[idx % PASTEL_COLORS.length],
        habitsCount: taggedHabits.length,
        todosCount: taggedTodos.length,
        habitDone: habitDoneCount,
        todoDone: todoDoneCount,
        value: totalDone,
      };
    });
  }, [tags, habits, todoTemplates, habitLogs, todoInstances]);

  // 4. DATA: Subject Balance Radar for NEET
  const subjectBalanceRadarData = useMemo(() => {
    return tags.map((tag) => {
      const taggedHabits = habits.filter((h) => h.tagIds.includes(tag.id));
      const taggedHabitIds = new Set(taggedHabits.map((h) => h.id));
      const habitCompletions = habitLogs.filter((l) => taggedHabitIds.has(l.habitId) && l.completed).length;

      const taggedTodos = todoTemplates.filter((t) => t.tagIds.includes(tag.id));
      const taggedTodoIds = new Set(taggedTodos.map((t) => t.id));
      const todoCompletions = todoInstances.filter((i) => taggedTodoIds.has(i.todoTemplateId) && i.completed).length;

      return {
        subject: tag.name.split(' ')[0], // short name
        completions: habitCompletions + todoCompletions,
        fullMark: 30,
      };
    });
  }, [tags, habits, habitLogs, todoTemplates, todoInstances]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-2xl shadow-xl text-xs border border-pink-200 dark:border-pink-800">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 my-0.5">
              <span className="flex items-center gap-1 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {entry.value}
                {dimension === 'habit' ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-3xl backdrop-blur-md bg-white/40 dark:bg-slate-900/50 p-5 md:p-6 mb-8 border border-white/60 dark:border-white/10 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/40 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
              Progress & Mastery Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize your consistency curve across Physics, Chemistry, Biology, and MCQ practice
          </p>
        </div>

        {/* Dimension & Granularity Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector */}
          <div className="flex items-center bg-white/60 dark:bg-slate-800/60 p-1 rounded-2xl border border-white/80 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {(
              [
                { id: 'habit', label: 'Habit Rates', icon: Flame },
                { id: 'todo', label: 'Tasks Flow', icon: CheckCircle2 },
                { id: 'tag', label: 'Subject Breakdown', icon: PieIcon },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`chart-dim-${tab.id}`}
                  onClick={() => setDimension(tab.id as ChartDimension)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                    dimension === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-xs font-bold'
                      : 'hover:text-pink-600 dark:hover:text-pink-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Granularity Selector */}
          <div className="flex items-center bg-white/60 dark:bg-slate-800/60 p-1 rounded-2xl border border-white/80 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((g) => (
              <button
                key={g}
                id={`chart-gran-${g}`}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-xl capitalize transition-all ${
                  granularity === g
                    ? 'bg-pink-500 text-white font-bold shadow-xs'
                    : 'hover:text-pink-600 dark:hover:text-pink-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-80 pt-2">
        {dimension === 'habit' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={habitCompletionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 114, 182, 0.15)" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {habits.map((habit, idx) => (
                <Line
                  key={habit.id}
                  type="monotone"
                  dataKey={habit.title.substring(0, 16)}
                  stroke={PASTEL_COLORS[idx % PASTEL_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {dimension === 'todo' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={todoCompletionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(244, 114, 182, 0.15)" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Completed" fill="#EC4899" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Pending" fill="#CBD5E1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {dimension === 'tag' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Completed Logs by Subject & Category
              </span>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={tagAggregatedData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {tagAggregatedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Balance Radar */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Study Balance Spectrum 🩺✨
              </span>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={subjectBalanceRadarData} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid stroke="rgba(244, 114, 182, 0.25)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" fontSize={9} />
                  <Radar
                    name="Completed Study Goals"
                    dataKey="completions"
                    stroke="#EC4899"
                    fill="#F472B6"
                    fillOpacity={0.4}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Habit Streak Leaderboard Banner */}
      <div className="mt-6 pt-4 border-t border-white/40 dark:border-white/10">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-pink-500" />
          <span>Habit Streaks & 30-Day Completion Rate</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {habits.map((habit) => {
            const streak = calculateHabitStreak(habit.id);
            return (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700/60 text-xs shadow-xs backdrop-blur-sm"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{habit.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    30-Day Rate: <span className="font-bold text-pink-600 dark:text-pink-400">{streak.completionRate}%</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 flex items-center gap-0.5 justify-end">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {streak.currentStreak}d
                    </span>
                    <span className="text-[10px] text-slate-400 block">Best: {streak.longestStreak}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
