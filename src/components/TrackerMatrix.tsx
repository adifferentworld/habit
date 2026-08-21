import React, { useMemo } from 'react';
import {
  Check,
  Flame,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  Layers,
  HeartHandshake,
  CheckSquare,
  Repeat,
  FileCheck2,
} from 'lucide-react';
import { useTracker } from '../context/TrackerContext';
import { Habit, Tag, TodoTemplate } from '../types';

export const TrackerMatrix: React.FC = () => {
  const {
    habits,
    habitLogs,
    todoTemplates,
    todoInstances,
    tags,
    selectedTagId,
    searchQuery,
    viewDaysCount,
    anchorDate,
    toggleHabitLog,
    toggleTodoInstance,
    calculateHabitStreak,
    deleteHabit,
    deleteTodoTemplate,
    setEditingItem,
    setIsCreateTodoOpen,
    setIsCreateHabitOpen,
    resetToStarterPack,
  } = useTracker();

  // Generate date columns based on anchorDate and viewDaysCount
  // If viewDaysCount is 7, we generate 7 days ending at anchorDate (or including anchorDate)
  const dateColumns = useMemo(() => {
    const dates: { dateStr: string; dayName: string; formatted: string; isToday: boolean; dayOfWeek: number }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = viewDaysCount - 1; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

      dates.push({
        dateStr,
        dayName,
        formatted: `${dayName} ${monthDay}`,
        isToday: dateStr === todayStr,
        dayOfWeek,
      });
    }
    return dates;
  }, [anchorDate, viewDaysCount]);

  // Filter Habits & Todos according to selected tag and search query
  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      // Tag filter
      if (selectedTagId && !habit.tagIds.includes(selectedTagId)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = habit.title.toLowerCase().includes(q);
        const matchNotes = habit.notes?.toLowerCase().includes(q) || false;
        const matchTag = habit.tagIds.some((tId) => {
          const t = tags.find((tag) => tag.id === tId);
          return t?.name.toLowerCase().includes(q);
        });
        return matchTitle || matchNotes || matchTag;
      }
      return true;
    });
  }, [habits, selectedTagId, searchQuery, tags]);

  const filteredTodoTemplates = useMemo(() => {
    return todoTemplates.filter((todo) => {
      // Tag filter
      if (selectedTagId && !todo.tagIds.includes(selectedTagId)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = todo.title.toLowerCase().includes(q);
        const matchNotes = todo.notes?.toLowerCase().includes(q) || false;
        const matchTag = todo.tagIds.some((tId) => {
          const t = tags.find((tag) => tag.id === tId);
          return t?.name.toLowerCase().includes(q);
        });
        return matchTitle || matchNotes || matchTag;
      }
      return true;
    });
  }, [todoTemplates, selectedTagId, searchQuery, tags]);

  // Tag helper
  const getTag = (tagId: string): Tag | undefined => tags.find((t) => t.id === tagId);

  const hasItems = filteredHabits.length > 0 || filteredTodoTemplates.length > 0;

  return (
    <div className="w-full rounded-3xl backdrop-blur-md bg-white/40 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 shadow-xl overflow-hidden mb-8">
      {/* Matrix Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 md:px-6 bg-white/20 dark:bg-white/5 border-b border-white/40 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-500 text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Weekly Completion Matrix</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-pink-600 dark:text-pink-300 border border-pink-100 dark:border-slate-700">
                {filteredHabits.length} Habits • {filteredTodoTemplates.length} Goals
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive date matrix with streak tracking and instant check-offs
            </p>
          </div>
        </div>

        {/* Legend & Shortcuts */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-md bg-pink-500"></div> Daily Habit
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-md bg-indigo-500"></div> Specific Goal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateHabitOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 text-pink-600 dark:text-pink-300 border border-pink-100 dark:border-slate-700 transition-all flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Habit
            </button>
            <button
              onClick={() => setIsCreateTodoOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-xs transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Goal
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Container */}
      {!hasItems ? (
        <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-pink-100/70 dark:bg-slate-800/70 text-pink-500 flex items-center justify-center mb-3 shadow-inner">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            No habits or tasks found matching your filter
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
            Start tracking your NEET syllabus preparation, MCQ solving routines, and tests!
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => resetToStarterPack()}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md hover:opacity-90 transition-all"
            >
              Load NEET Preset 🩺
            </button>
            <button
              onClick={() => setIsCreateHabitOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-2xl bg-white/80 dark:bg-slate-800 text-pink-600 dark:text-pink-300 border border-pink-100 dark:border-slate-700 hover:bg-white transition-all"
            >
              + Custom Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            {/* Table Head: Sticky Title/Subject Column + Date Columns */}
            <thead className="bg-white/10 dark:bg-white/5">
              <tr className="border-b border-white/40 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                {/* Sticky Item Column */}
                <th className="sticky left-0 z-10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md px-4 py-3.5 min-w-[260px] md:min-w-[320px] font-bold text-slate-700 dark:text-slate-200 border-r border-white/40 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Tracking Items</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      Subject & Streak
                    </span>
                  </div>
                </th>

                {/* Date Columns */}
                {dateColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`px-2 py-3 text-center min-w-[60px] border-r border-white/30 dark:border-white/10 transition-colors ${
                      col.isToday
                        ? 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 font-bold rounded-t-xl'
                        : 'font-semibold text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {col.isToday ? 'Today' : col.dayName}
                      </span>
                      <span
                        className={`text-xs mt-0.5 font-normal opacity-80 ${
                          col.isToday ? 'text-pink-600 dark:text-pink-300 font-bold' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {col.dateStr.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/40 dark:divide-white/10 text-xs">
              {/* SECTION: HABITS */}
              {filteredHabits.length > 0 && (
                <>
                  <tr className="bg-pink-50/30 dark:bg-pink-950/20">
                    <td
                      colSpan={dateColumns.length + 1}
                      className="px-4 py-1.5 text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
                      <span>Daily Habits ({filteredHabits.length})</span>
                    </td>
                  </tr>

                  {filteredHabits.map((habit) => {
                    const streak = calculateHabitStreak(habit.id);
                    return (
                      <tr
                        key={habit.id}
                        className="group hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Sticky Item Column */}
                        <td className="sticky left-0 z-10 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md px-4 py-3 border-r border-white/40 dark:border-white/10">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                {habit.title}
                              </div>

                              {/* Tags & Notes */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {habit.tagIds.map((tId) => {
                                  const tag = getTag(tId);
                                  if (!tag) return null;
                                  return (
                                    <span
                                      key={tag.id}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                      style={{
                                        backgroundColor: `${tag.color}15`,
                                        borderColor: `${tag.color}40`,
                                        color: tag.color,
                                      }}
                                    >
                                      #{tag.name}
                                    </span>
                                  );
                                })}

                                {habit.frequency === 'weeklyDays' && (
                                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                                    {habit.daysOfWeek.length}d/week
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Streaks Badge & Quick Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div
                                title={`Current Streak: ${streak.currentStreak} days | Longest: ${streak.longestStreak} days`}
                                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-transform ${
                                  streak.currentStreak > 0
                                    ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800/60'
                                    : 'bg-slate-100/60 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <Flame
                                  className={`w-3.5 h-3.5 ${
                                    streak.currentStreak > 0
                                      ? 'text-orange-500 animate-pulse'
                                      : 'text-slate-300'
                                  }`}
                                />
                                <span>{streak.currentStreak}d</span>
                              </div>

                              {/* Edit / Delete Buttons */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  onClick={() => setEditingItem({ type: 'habit', item: habit })}
                                  title="Edit Habit"
                                  className="p-1 text-slate-400 hover:text-pink-600 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete habit "${habit.title}"?`)) {
                                      deleteHabit(habit.id);
                                    }
                                  }}
                                  title="Delete Habit"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Habit Checkboxes for Each Date */}
                        {dateColumns.map((col) => {
                          const isScheduled =
                            habit.frequency === 'daily' || habit.daysOfWeek.includes(col.dayOfWeek);

                          const isCompleted = habitLogs.some(
                            (l) => l.habitId === habit.id && l.date === col.dateStr && l.completed
                          );

                          return (
                            <td
                              key={col.dateStr}
                              className={`p-2 text-center border-r border-white/30 dark:border-white/10 transition-colors ${
                                col.isToday ? 'bg-pink-500/5 dark:bg-pink-500/10' : ''
                              }`}
                            >
                              {isScheduled ? (
                                <button
                                  onClick={() => toggleHabitLog(habit.id, col.dateStr)}
                                  className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                    isCompleted
                                      ? 'bg-pink-500 text-white shadow-xs font-bold'
                                      : col.isToday
                                      ? 'border-2 border-pink-300 dark:border-pink-600 ring-2 ring-pink-100 dark:ring-pink-950 bg-white/40 dark:bg-slate-800/40 hover:bg-pink-50'
                                      : 'border-2 border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 hover:border-pink-300'
                                  }`}
                                  title={`${habit.title} on ${col.formatted}: ${
                                    isCompleted ? 'Completed (click to undo)' : 'Pending (click to mark done)'
                                  }`}
                                >
                                  {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              ) : (
                                <div
                                  title="Rest / Off-schedule day"
                                  className="w-6 h-6 mx-auto rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 opacity-20 flex items-center justify-center text-slate-400 select-none text-[10px]"
                                >
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              )}

              {/* SECTION: TODOS / GOALS */}
              {filteredTodoTemplates.length > 0 && (
                <>
                  <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                    <td
                      colSpan={dateColumns.length + 1}
                      className="px-4 py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Specific Goals & Tests ({filteredTodoTemplates.length})</span>
                    </td>
                  </tr>

                  {filteredTodoTemplates.map((todo) => {
                    return (
                      <tr
                        key={todo.id}
                        className="group hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Sticky Item Column */}
                        <td className="sticky left-0 z-10 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md px-4 py-3 border-r border-white/40 dark:border-white/10">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                {todo.title}
                              </div>

                              {/* Tags & Repeatable indicator */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {todo.tagIds.map((tId) => {
                                  const tag = getTag(tId);
                                  if (!tag) return null;
                                  return (
                                    <span
                                      key={tag.id}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                      style={{
                                        backgroundColor: `${tag.color}15`,
                                        borderColor: `${tag.color}40`,
                                        color: tag.color,
                                      }}
                                    >
                                      #{tag.name}
                                    </span>
                                  );
                                })}

                                {todo.isRepeatable && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                                    <Repeat className="w-2.5 h-2.5" /> Recurring
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Edit / Delete Buttons */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                              <button
                                onClick={() => setEditingItem({ type: 'todo', item: todo })}
                                title="Edit Task Template"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete goal "${todo.title}"?`)) {
                                    deleteTodoTemplate(todo.id);
                                  }
                                }}
                                title="Delete Task"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Todo Checkboxes for each date */}
                        {dateColumns.map((col) => {
                          const instance = todoInstances.find(
                            (inst) => inst.todoTemplateId === todo.id && inst.date === col.dateStr
                          );

                          const isCompleted = instance?.completed || false;
                          const hasInstance = !!instance;

                          return (
                            <td
                              key={col.dateStr}
                              className={`p-2 text-center border-r border-white/30 dark:border-white/10 transition-colors ${
                                col.isToday ? 'bg-pink-500/5 dark:bg-pink-500/10' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleTodoInstance(todo.id, col.dateStr)}
                                className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                  isCompleted
                                    ? 'bg-indigo-500 text-white shadow-xs font-bold'
                                    : col.isToday
                                    ? 'border-2 border-pink-300 dark:border-pink-600 ring-2 ring-pink-100 dark:ring-pink-950 bg-white/40 dark:bg-slate-800/40 hover:bg-pink-50'
                                    : hasInstance
                                    ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-400'
                                    : 'border-2 border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 hover:border-indigo-300 text-slate-300 dark:text-slate-600'
                                }`}
                                title={`${todo.title} on ${col.formatted}: ${
                                  isCompleted
                                    ? 'Completed (click to undo)'
                                    : hasInstance
                                    ? 'Scheduled (click to mark done)'
                                    : 'Click to schedule and mark done'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : hasInstance ? (
                                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                ) : (
                                  <Plus className="w-2.5 h-2.5 opacity-30 hover:opacity-100" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
