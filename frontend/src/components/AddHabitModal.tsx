import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { X, Flame, Calendar, Clock, PlusCircle } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    importance_score?: number;
    designated_week_days: string[];
    scheduled_time?: string;
    estimated_minutes?: number;
  }) => Promise<void>;
  editHabit?: Habit | null;
}

const ALL_WEEKDAYS = [
  { key: 'MONDAY', label: 'Mon' },
  { key: 'TUESDAY', label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY', label: 'Thu' },
  { key: 'FRIDAY', label: 'Fri' },
  { key: 'SATURDAY', label: 'Sat' },
  { key: 'SUNDAY', label: 'Sun' }
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onSave, editHabit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importanceScore, setImportanceScore] = useState<number>(5);
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_WEEKDAYS.map(d => d.key));
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editHabit) {
      setTitle(editHabit.title);
      setDescription(editHabit.description || '');
      setImportanceScore(editHabit.importance_score || 5);
      setSelectedDays(editHabit.designated_week_days || ALL_WEEKDAYS.map(d => d.key));
      setScheduledTime(editHabit.scheduled_time || '');
      setEstimatedMinutes(editHabit.estimated_minutes || 20);
    } else {
      setTitle('');
      setDescription('');
      setImportanceScore(5);
      setSelectedDays(ALL_WEEKDAYS.map(d => d.key));
      setScheduledTime('');
      setEstimatedMinutes(20);
    }
  }, [editHabit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayKey: string) => {
    setSelectedDays(prev =>
      prev.includes(dayKey)
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  const selectAllDays = () => setSelectedDays(ALL_WEEKDAYS.map(d => d.key));
  const selectWeekdaysOnly = () => setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Select at least one designated day');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        importance_score: importanceScore,
        designated_week_days: selectedDays,
        scheduled_time: scheduledTime || undefined,
        estimated_minutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes)
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{editHabit ? 'Edit Habit' : 'Add New Habit'}</h2>
              <p className="text-xs text-slate-400">Track repeating daily or weekly habits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Habit Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Workout / Read 20 Pages"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, notes or target metric..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase text-slate-300">
                Importance Score (1 - 10)
              </label>
              <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                Score: {importanceScore}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={importanceScore}
              onChange={(e) => setImportanceScore(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Designated Days</span>
              </label>
              <div className="space-x-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-emerald-400 hover:underline"
                >
                  All Days
                </button>
                <button
                  type="button"
                  onClick={selectWeekdaysOnly}
                  className="text-slate-400 hover:underline"
                >
                  Mon-Fri
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {ALL_WEEKDAYS.map(day => {
                const active = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time (Optional)</span>
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Est. Minutes
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="20"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : editHabit ? 'Update Habit' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
