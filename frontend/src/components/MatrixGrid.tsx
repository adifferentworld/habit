import React, { useState } from 'react';
import { Habit, Todo, TodoOccurrence, ActivityLog } from '../types';
import { Flame, CheckSquare, Plus, Play, Pause, Trash2, Calendar, Star, ChevronRight, Filter, Search } from 'lucide-react';

interface MatrixGridProps {
  habits: Habit[];
  todos: Todo[];
  occurrences: TodoOccurrence[];
  logs: ActivityLog[];
  dates: string[]; // 16 date strings chronologically: [T-15, ..., Today]
  todayStr: string;
  onCellClick: (
    itemTitle: string,
    itemType: 'HABIT' | 'TODO',
    habitId: string | undefined,
    todoOccurrenceId: string | undefined,
    dateStr: string,
    existingLogs: ActivityLog[]
  ) => void;
  onItemClick: (item: Habit | Todo, type: 'HABIT' | 'TODO') => void;
  onAddHabitClick: () => void;
  onAddTodoClick: () => void;
  onCreateOccurrence: (todoId: string, forDate: string) => Promise<void>;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  habits,
  todos,
  occurrences,
  logs,
  dates,
  todayStr,
  onCellClick,
  onItemClick,
  onAddHabitClick,
  onAddTodoClick,
  onCreateOccurrence
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'HABITS' | 'TODOS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Map logs by key: `${type}_${habitId_or_todoOccurrenceId}_${date}`
  const logsMap = new Map<string, ActivityLog[]>();
  logs.forEach((log) => {
    let key = '';
    if (log.type === 'HABIT' && log.habit_id) {
      key = `HABIT_${log.habit_id}_${log.activity_date}`;
    } else if (log.type === 'TODO' && log.todo_occurrence_id) {
      key = `TODO_${log.todo_occurrence_id}_${log.activity_date}`;
    }
    if (key) {
      const existing = logsMap.get(key) || [];
      existing.push(log);
      logsMap.set(key, existing);
    }
  });

  // Also map occurrences by `${todo_id}_${for_date}`
  const occurrencesMap = new Map<string, TodoOccurrence>();
  occurrences.forEach((occ) => {
    occurrencesMap.set(`${occ.todo_id}_${occ.for_date}`, occ);
  });

  // Filter items
  const filteredHabits = habits.filter((h) => {
    if (filterType === 'TODOS') return false;
    if (searchQuery && !h.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredTodos = todos.filter((t) => {
    if (filterType === 'HABITS') return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Helper to format header date (e.g. "Aug 12" / "Wed")
  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dayName, monthDay };
  };

  // Calculate 3 progress bars for a habit or todo
  const calculateProgress = (item: Habit | Todo, type: 'HABIT' | 'TODO') => {
    let weeklyRate = 0;
    let monthlyRate = 0;
    let progressSoFar = item.progress_score || 0;

    const last7Dates = dates.slice(-7);
    const last16Dates = dates;

    let loggedIn7 = 0;
    let loggedIn16 = 0;

    if (type === 'HABIT') {
      const habitLogs = logs.filter((l) => l.type === 'HABIT' && l.habit_id === item.id);
      const uniqueLoggedDates = new Set(habitLogs.map((l) => l.activity_date));

      last7Dates.forEach((d) => { if (uniqueLoggedDates.has(d)) loggedIn7++; });
      last16Dates.forEach((d) => { if (uniqueLoggedDates.has(d)) loggedIn16++; });

      weeklyRate = Math.min(100, Math.round((loggedIn7 / 7) * 100));
      monthlyRate = Math.min(100, Math.round((loggedIn16 / 16) * 100));
    } else {
      const todo = item as Todo;
      const todoOccs = occurrences.filter((o) => o.todo_id === todo.id);
      const completedOccs = todoOccs.filter((o) => o.status === 'COMPLETED');

      weeklyRate = todoOccs.length > 0 ? Math.round((completedOccs.length / todoOccs.length) * 100) : 0;
      monthlyRate = todo.scheduled_count > 0 ? Math.round((todo.completed_count / todo.scheduled_count) * 100) : 0;
    }

    return {
      weekly: Math.min(100, Math.max(0, weeklyRate)),
      monthly: Math.min(100, Math.max(0, monthlyRate)),
      soFar: Math.min(100, Math.max(0, progressSoFar))
    };
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search habits & todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({habits.length + todos.length})
            </button>
            <button
              onClick={() => setFilterType('HABITS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'HABITS'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Habits ({habits.length})
            </button>
            <button
              onClick={() => setFilterType('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'TODOS'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({todos.length})
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAddHabitClick}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Habit</span>
          </button>

          <button
            onClick={onAddTodoClick}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Todo</span>
          </button>
        </div>
      </div>

      {/* MATRIX TABLE DISPLAY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-x-auto">
        <div className="min-w-[1280px]">
          {/* Header Row: Item Name | 16 Date Columns (T-15 ... Today) | 3 Progress Bars */}
          <div className="grid grid-cols-[240px_repeat(16,minmax(42px,1fr))_200px] border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20 text-xs text-slate-400">
            {/* Leftmost Column Header */}
            <div className="p-3 font-semibold uppercase tracking-wider flex items-center justify-between border-r border-slate-800">
              <span>Item Name</span>
              <span className="text-[10px] text-slate-500 font-normal">Active</span>
            </div>

            {/* 16 Date Column Headers */}
            {dates.map((dStr, idx) => {
              const { dayName, monthDay } = formatHeaderDate(dStr);
              const isToday = dStr === todayStr;
              return (
                <div
                  key={dStr}
                  className={`p-2 text-center border-r border-slate-800 flex flex-col justify-center items-center ${
                    isToday ? 'bg-indigo-600/20 font-bold text-indigo-300 border-indigo-500/50' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase text-slate-500 font-mono">{dayName}</span>
                  <span className={`text-[11px] ${isToday ? 'text-indigo-200' : 'text-slate-300'}`}>
                    {monthDay}
                  </span>
                  {isToday && (
                    <span className="mt-0.5 px-1 bg-indigo-500 text-[9px] text-white rounded font-extrabold uppercase">
                      NOW
                    </span>
                  )}
                </div>
              );
            })}

            {/* Rightmost Column Header: 3 Progress Bars */}
            <div className="p-3 font-semibold uppercase tracking-wider text-center flex flex-col justify-center">
              <span>Progress Bars</span>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 font-normal mt-1">
                <span>Weekly</span>
                <span>Monthly</span>
                <span>So Far</span>
              </div>
            </div>
          </div>

          {/* Table Body: Habits First, then Todos */}
          <div className="divide-y divide-slate-800/60">
            {filteredHabits.length === 0 && filteredTodos.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm">
                No items found. Click "+ Habit" or "+ Todo" above to create your first item!
              </div>
            )}

            {/* HABITS ROWS */}
            {filteredHabits.map((habit) => {
              const progress = calculateProgress(habit, 'HABIT');
              const isStopped = habit.status === 'STOPPED';

              return (
                <div
                  key={habit.id}
                  className={`grid grid-cols-[240px_repeat(16,minmax(42px,1fr))_200px] items-center hover:bg-slate-800/40 transition-colors ${
                    isStopped ? 'opacity-50 bg-slate-950/40' : ''
                  }`}
                >
                  {/* Leftmost Column: Clickable Habit Info */}
                  <div
                    onClick={() => onItemClick(habit, 'HABIT')}
                    className="p-3 border-r border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                            {habit.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            HABIT
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>Imp: {habit.importance_score}/10</span>
                          <span>•</span>
                          <span>Streak: {habit.completed_days}d</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>

                  {/* 16 Matrix Date Cells */}
                  {dates.map((dStr) => {
                    const key = `HABIT_${habit.id}_${dStr}`;
                    const cellLogs = logsMap.get(key) || [];
                    const isToday = dStr === todayStr;

                    const totalScore = cellLogs.reduce((acc, l) => acc + l.score, 0);
                    const avgScore = cellLogs.length > 0 ? Math.round(totalScore / cellLogs.length) : 0;

                    return (
                      <div
                        key={dStr}
                        onClick={() => onCellClick(habit.title, 'HABIT', habit.id, undefined, dStr, cellLogs)}
                        className={`h-12 border-r border-slate-800 flex items-center justify-center p-1 cursor-pointer transition-all hover:ring-1 hover:ring-emerald-400 ${
                          isToday ? 'bg-indigo-950/30' : ''
                        }`}
                      >
                        {cellLogs.length > 0 ? (
                          <div
                            className={`w-full h-8 rounded-lg flex flex-col items-center justify-center font-bold text-xs shadow-sm ${
                              avgScore >= 8
                                ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
                                : avgScore >= 5
                                ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                                : 'bg-slate-700/50 border border-slate-600 text-slate-300'
                            }`}
                          >
                            <span>{avgScore}</span>
                            {cellLogs.length > 1 && (
                              <span className="text-[8px] text-slate-400 font-mono">({cellLogs.length}x)</span>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`w-full h-8 rounded-lg border border-dashed flex items-center justify-center text-[10px] text-slate-600 hover:border-slate-500 hover:text-slate-400 ${
                              isToday ? 'border-indigo-500/40 text-indigo-400' : 'border-slate-800'
                            }`}
                          >
                            {isToday ? <Plus className="w-3 h-3 text-indigo-400" /> : '—'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rightmost Column: 3 Horizontal Progress Bars */}
                  <div className="p-3 flex flex-col justify-center space-y-2">
                    {/* Weekly Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-emerald-400 font-semibold">W:</span>
                        <span>{progress.weekly}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.weekly}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Monthly Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-teal-400 font-semibold">M:</span>
                        <span>{progress.monthly}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.monthly}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress So Far Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-indigo-400 font-semibold">So Far:</span>
                        <span>{progress.soFar}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.soFar}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* TODOS ROWS */}
            {filteredTodos.map((todo) => {
              const progress = calculateProgress(todo, 'TODO');

              return (
                <div
                  key={todo.id}
                  className="grid grid-cols-[240px_repeat(16,minmax(42px,1fr))_200px] items-center hover:bg-slate-800/40 transition-colors"
                >
                  {/* Leftmost Column: Clickable Todo Info */}
                  <div
                    onClick={() => onItemClick(todo, 'TODO')}
                    className="p-3 border-r border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30 shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-300 transition-colors">
                            {todo.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            TODO
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span className="text-purple-400 font-semibold">{todo.priority}</span>
                          <span>•</span>
                          <span>{todo.completed_count}/{todo.scheduled_count} Done</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                  </div>

                  {/* 16 Matrix Date Cells for Todo Occurrences */}
                  {dates.map((dStr) => {
                    const occ = occurrencesMap.get(`${todo.id}_${dStr}`);
                    const isToday = dStr === todayStr;

                    const key = occ ? `TODO_${occ.id}_${dStr}` : '';
                    const cellLogs = key ? logsMap.get(key) || [] : [];

                    const totalScore = cellLogs.reduce((acc, l) => acc + l.score, 0);
                    const avgScore = cellLogs.length > 0 ? Math.round(totalScore / cellLogs.length) : 0;

                    return (
                      <div
                        key={dStr}
                        onClick={() => {
                          if (occ) {
                            onCellClick(todo.title, 'TODO', undefined, occ.id, dStr, cellLogs);
                          } else if (isToday) {
                            onCreateOccurrence(todo.id, todayStr);
                          }
                        }}
                        className={`h-12 border-r border-slate-800 flex items-center justify-center p-1 cursor-pointer transition-all hover:ring-1 hover:ring-purple-400 ${
                          isToday ? 'bg-indigo-950/30' : ''
                        }`}
                      >
                        {occ ? (
                          <div
                            className={`w-full h-8 rounded-lg flex flex-col items-center justify-center font-bold text-xs shadow-sm ${
                              occ.status === 'COMPLETED' || avgScore > 0
                                ? 'bg-purple-500/30 border border-purple-400 text-purple-200'
                                : 'bg-slate-800 border border-slate-700 text-slate-400'
                            }`}
                          >
                            <span>{avgScore > 0 ? avgScore : '✓'}</span>
                            {cellLogs.length > 1 && (
                              <span className="text-[8px] text-slate-400 font-mono">({cellLogs.length}x)</span>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`w-full h-8 rounded-lg border border-dashed flex items-center justify-center text-[10px] text-slate-600 hover:border-purple-500/50 hover:text-purple-300 ${
                              isToday ? 'border-indigo-500/40 text-indigo-400' : 'border-slate-800'
                            }`}
                          >
                            {isToday ? <Plus className="w-3 h-3 text-purple-400" /> : '—'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rightmost Column: 3 Horizontal Progress Bars */}
                  <div className="p-3 flex flex-col justify-center space-y-2">
                    {/* Weekly Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-purple-400 font-semibold">W:</span>
                        <span>{progress.weekly}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.weekly}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Monthly Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-pink-400 font-semibold">M:</span>
                        <span>{progress.monthly}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-pink-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.monthly}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Progress So Far Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                        <span className="text-indigo-400 font-semibold">So Far:</span>
                        <span>{progress.soFar}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress.soFar}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
