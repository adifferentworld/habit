import React, { useState } from 'react';
import { X, HeartHandshake, Plus, Tag as TagIcon, Check, Calendar, Sparkles } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 0, label: 'Sun', full: 'Sunday' },
];

export const CreateHabitModal: React.FC = () => {
  const { isCreateHabitOpen, setIsCreateHabitOpen, setIsCreateTagOpen, tags, createHabit } = useTracker();

  const [title, setTitle] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'daily' | 'weeklyDays'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [notes, setNotes] = useState('');

  if (!isCreateHabitOpen) return null;

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        // Prevent deselecting all days
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createHabit(
      title.trim(),
      selectedTagIds,
      frequency,
      frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
      notes.trim() || undefined
    );

    // Reset
    setTitle('');
    setSelectedTagIds([]);
    setFrequency('daily');
    setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    setNotes('');
    setIsCreateHabitOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-white/95 dark:bg-zinc-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-rose-200/80 dark:border-rose-900/60 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsCreateHabitOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-pink-100/50 dark:hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-heading">
              New Study Habit 🌸
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Build automatic consistency for NEET preparation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Habit Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Habit Name / MCQ Goal
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 50 MCQs Physics Daily, NCERT Bio Diagram Revision..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-pink-200 dark:border-pink-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50"
              autoFocus
            />
          </div>

          {/* Tag Selector with inline create tag */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Select Subject & Topic Tags
              </label>
              <button
                type="button"
                onClick={() => setIsCreateTagOpen(true)}
                className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> New Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-pink-100 dark:border-pink-900/40 min-h-[44px]">
              {tags.length === 0 ? (
                <span className="text-xs text-slate-400">No tags yet. Create one above!</span>
              ) : (
                tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-xs ${
                        isSelected
                          ? 'text-white ring-2 ring-rose-400/50 shadow-sm'
                          : 'bg-white/80 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? tag.color : undefined,
                        borderColor: isSelected ? tag.color : `${tag.color}40`,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Frequency Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Frequency Schedule
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  frequency === 'daily'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-pink-200 dark:border-pink-900 hover:bg-rose-50'
                }`}
              >
                <span>Daily (Every single day)</span>
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weeklyDays')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  frequency === 'weeklyDays'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-pink-200 dark:border-pink-900 hover:bg-rose-50'
                }`}
              >
                <span>Specific Days of Week</span>
              </button>
            </div>

            {/* Days of Week Checkbox Pills */}
            {frequency === 'weeklyDays' && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50/60 dark:bg-zinc-800/80 border border-rose-200 dark:border-rose-900/50 animate-in fade-in">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                  Select Active Days:
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-700 text-slate-500 dark:text-slate-400 hover:bg-rose-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Study Notes / Reminders (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Focus on rotational mechanics and optics numericals"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-pink-200 dark:border-pink-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-pink-100 dark:border-pink-900/40">
            <button
              type="button"
              onClick={() => setIsCreateHabitOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
