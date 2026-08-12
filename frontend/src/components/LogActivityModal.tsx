import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { X, Check, Award, Clock, Star, Plus, Trash2, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  itemType: 'HABIT' | 'TODO';
  habitId?: string;
  todoOccurrenceId?: string;
  activityDate: string;
  isToday: boolean;
  existingLogs: ActivityLog[];
  onLogSubmit: (data: {
    type: 'HABIT' | 'TODO';
    habit_id?: string;
    todo_occurrence_id?: string;
    activity_date: string;
    score: number;
    multiplier: number;
    duration_minutes?: number;
  }) => Promise<void>;
  onDeleteLog?: (logId: string) => Promise<void>;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  itemTitle,
  itemType,
  habitId,
  todoOccurrenceId,
  activityDate,
  isToday,
  existingLogs,
  onLogSubmit,
  onDeleteLog
}) => {
  const [score, setScore] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [duration, setDuration] = useState<number | ''>(20);
  const [loading, setLoading] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScore(10);
    setMultiplier(1);
    setDuration(20);
    setError(null);
  }, [isOpen, activityDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isToday) {
      setError('According to rules, logs can only be recorded for TODAY (User Timezone). For historical dates, view logs only.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onLogSubmit({
        type: itemType,
        habit_id: habitId,
        todo_occurrence_id: todoOccurrenceId,
        activity_date: activityDate,
        score,
        multiplier,
        duration_minutes: duration === '' ? undefined : Number(duration)
      });

      // Confetti celebration for score >= 8
      if (score >= 8) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!onDeleteLog) return;
    setDeletingLogId(logId);
    setError(null);
    try {
      await onDeleteLog(logId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete log');
    } finally {
      setDeletingLogId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  itemType === 'HABIT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}
              >
                {itemType}
              </span>
              <span className="text-xs text-slate-400 font-mono">{activityDate}</span>
              {isToday && (
                <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold border border-indigo-500/30">
                  TODAY
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold mt-1 text-white truncate max-w-xs">{itemTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing logs summary for this date */}
        {existingLogs.length > 0 && (
          <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Logs for this date ({existingLogs.length})
            </h3>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {existingLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs border border-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white">Score: {log.score}/10</span>
                    {log.multiplier > 1 && (
                      <span className="text-[10px] font-bold text-emerald-400 px-1 bg-emerald-500/10 rounded">
                        {log.multiplier}x
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.duration_minutes || 0}m</span>
                    </div>
                    {onDeleteLog && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingLogId === log.id}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
                        title="Delete this log"
                      >
                        {deletingLogId === log.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="my-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {!isToday ? (
          <div className="my-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Activity logging is restricted to <strong>Today</strong> according to business rules. Past dates are read-only history.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase text-slate-300 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Activity Score (1 - 10)</span>
                </label>
                <span className="text-sm font-extrabold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  {score} / 10
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScore(s)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      score === s
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Multiplier
                </label>
                <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[1, 2, 3].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiplier(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        multiplier === m
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration (Minutes)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Logging...' : 'Log Activity'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
