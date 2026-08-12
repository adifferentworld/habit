import React, { useState, useEffect } from 'react';
import { Habit, Todo } from '../types';
import { X, Flame, CheckSquare, Pause, Play, Trash2, Edit2, Check, Loader2, Award, Calendar, AlertTriangle } from 'lucide-react';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Habit | Todo | null;
  type: 'HABIT' | 'TODO';
  onUpdateHabit?: (id: string, data: Partial<Habit>) => Promise<void>;
  onUpdateTodo?: (id: string, data: Partial<Todo>) => Promise<void>;
  onStopHabit?: (id: string) => Promise<void>;
  onResumeHabit?: (id: string) => Promise<void>;
  onDeleteHabit?: (id: string) => Promise<void>;
  onDeleteTodo?: (id: string) => Promise<void>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onUpdateHabit,
  onUpdateTodo,
  onStopHabit,
  onResumeHabit,
  onDeleteHabit,
  onDeleteTodo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(5);
  const [priority, setPriority] = useState('MEDIUM');
  
  const [loadingAction, setLoadingAction] = useState<'SAVE' | 'PAUSE' | 'RESUME' | 'DELETE' | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      if (type === 'HABIT') {
        setImportance((item as Habit).importance_score || 5);
      } else {
        setPriority((item as Todo).priority || 'MEDIUM');
      }
    }
    setIsEditing(false);
    setShowConfirmDelete(false);
    setError(null);
    setLoadingAction(null);
  }, [item, isOpen, type]);

  if (!isOpen || !item) return null;

  const isHabit = type === 'HABIT';
  const habit = isHabit ? (item as Habit) : null;
  const todo = !isHabit ? (item as Todo) : null;
  const isStopped = habit?.status === 'STOPPED';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoadingAction('SAVE');
    setError(null);
    try {
      if (isHabit && habit && onUpdateHabit) {
        await onUpdateHabit(habit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          importance_score: Number(importance)
        });
      } else if (!isHabit && todo && onUpdateTodo) {
        await onUpdateTodo(todo.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority
        });
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTogglePause = async () => {
    if (!habit) return;
    const action = isStopped ? 'RESUME' : 'PAUSE';
    setLoadingAction(action);
    setError(null);
    try {
      if (isStopped && onResumeHabit) {
        await onResumeHabit(habit.id);
      } else if (!isStopped && onStopHabit) {
        await onStopHabit(habit.id);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    setLoadingAction('DELETE');
    setError(null);
    try {
      if (isHabit && habit && onDeleteHabit) {
        await onDeleteHabit(habit.id);
      } else if (!isHabit && todo && onDeleteTodo) {
        await onDeleteTodo(todo.id);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-xl border ${
              isHabit 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
              {isHabit ? <Flame className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                isHabit
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {type}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5 truncate max-w-xs">{item.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Edit item"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Edit Form OR Details View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {isHabit ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Importance Score (1 - 10): <span className="text-emerald-400 font-bold">{importance}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                </select>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingAction === 'SAVE'}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingAction === 'SAVE' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{loadingAction === 'SAVE' ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Metadata Stats Card */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
                <p className="text-xs font-bold text-white mt-0.5">
                  {isHabit ? (isStopped ? 'PAUSED' : 'ACTIVE') : (todo?.status || 'ACTIVE')}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Progress</span>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">
                  {Math.round(item.progress_score || 0)}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {isHabit ? 'Importance' : 'Priority'}
                </span>
                <p className="text-xs font-bold text-indigo-400 mt-0.5">
                  {isHabit ? `${habit?.importance_score}/10` : todo?.priority}
                </p>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Description</span>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Action Buttons: Pause/Resume + Delete */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {showConfirmDelete ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Are you sure you want to delete this {type.toLowerCase()}?</span>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loadingAction === 'DELETE'}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loadingAction === 'DELETE' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>{loadingAction === 'DELETE' ? 'Deleting...' : 'Confirm Delete'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {isHabit ? (
                    <button
                      onClick={handleTogglePause}
                      disabled={loadingAction === 'PAUSE' || loadingAction === 'RESUME'}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                        isStopped
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                      }`}
                    >
                      {loadingAction === 'PAUSE' || loadingAction === 'RESUME' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isStopped ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                      <span>
                        {loadingAction === 'PAUSE'
                          ? 'Pausing...'
                          : loadingAction === 'RESUME'
                          ? 'Resuming...'
                          : isStopped
                          ? 'Resume Habit'
                          : 'Pause Habit'}
                      </span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete {type === 'HABIT' ? 'Habit' : 'Todo'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
