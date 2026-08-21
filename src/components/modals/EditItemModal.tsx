import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Tag as TagIcon, Flame, HeartHandshake, CheckSquare, Sparkles, Check } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { Habit, TodoTemplate, Tag } from '../../types';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const EditItemModal: React.FC = () => {
  const {
    editingItem,
    setEditingItem,
    tags,
    updateHabit,
    deleteHabit,
    updateTodoTemplate,
    deleteTodoTemplate,
    calculateHabitStreak,
  } = useTracker();

  const [title, setTitle] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Habit specific
  const [frequency, setFrequency] = useState<'daily' | 'weeklyDays'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Todo specific
  const [isRepeatable, setIsRepeatable] = useState(false);

  useEffect(() => {
    if (!editingItem) return;
    const item = editingItem.item;
    setTitle(item.title || item.name || '');
    setSelectedTagIds(item.tagIds || []);
    setNotes(item.notes || '');

    if (editingItem.type === 'habit') {
      const h = item as Habit;
      setFrequency(h.frequency);
      setSelectedDays(h.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    } else if (editingItem.type === 'todo') {
      const t = item as TodoTemplate;
      setIsRepeatable(t.isRepeatable || false);
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingItem.type === 'habit') {
      const updated: Habit = {
        ...editingItem.item,
        title: title.trim(),
        tagIds: selectedTagIds,
        frequency,
        daysOfWeek: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
        notes: notes.trim() || undefined,
      };
      await updateHabit(updated);
    } else if (editingItem.type === 'todo') {
      const updated: TodoTemplate = {
        ...editingItem.item,
        title: title.trim(),
        tagIds: selectedTagIds,
        isRepeatable,
        notes: notes.trim() || undefined,
      };
      await updateTodoTemplate(updated);
    }

    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${editingItem.type}?`)) return;

    if (editingItem.type === 'habit') {
      await deleteHabit(editingItem.item.id);
    } else if (editingItem.type === 'todo') {
      await deleteTodoTemplate(editingItem.item.id);
    }

    setEditingItem(null);
  };

  const habitStreak =
    editingItem.type === 'habit' ? calculateHabitStreak(editingItem.item.id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-white/95 dark:bg-zinc-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-pink-200/80 dark:border-pink-800/60 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setEditingItem(null)}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-pink-100/50 dark:hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-heading">
              Edit {editingItem.type === 'habit' ? 'Habit' : 'Task Template'} ✨
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update details, schedule, or subject tags
            </p>
          </div>
        </div>

        {/* Habit Streak Summary card if habit */}
        {habitStreak && (
          <div className="mb-4 p-3 rounded-2xl bg-orange-50/70 dark:bg-zinc-800/80 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  Current Streak: {habitStreak.currentStreak} Days
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Longest: {habitStreak.longestStreak}d • 30-day rate: {habitStreak.completionRate}%
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
              {habitStreak.totalCompletions} completions
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-pink-200 dark:border-pink-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Subject & Topic Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-pink-100 dark:border-pink-900/40 min-h-[44px]">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-xs ${
                      isSelected
                        ? 'text-white ring-2 ring-pink-400/50 shadow-sm'
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
              })}
            </div>
          </div>

          {/* Habit Schedule options */}
          {editingItem.type === 'habit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    frequency === 'daily'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-pink-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('weeklyDays')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    frequency === 'weeklyDays'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-pink-200'
                  }`}
                >
                  Specific Days
                </button>
              </div>

              {frequency === 'weeklyDays' && (
                <div className="grid grid-cols-7 gap-1 p-2 bg-rose-50/50 dark:bg-zinc-800 rounded-xl">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-white dark:bg-zinc-700 text-slate-500'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Notes / Reminders
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-pink-200 dark:border-pink-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-pink-100 dark:border-pink-900/40">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
