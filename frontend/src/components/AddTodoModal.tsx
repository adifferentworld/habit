import React, { useState, useEffect } from 'react';
import { Todo, Priority } from '../types';
import { X, CheckSquare, Calendar, Clock, PlusCircle } from 'lucide-react';

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    priority?: Priority;
    due_date?: string;
    estimated_minutes?: number;
    createOccurrenceToday?: boolean;
  }) => Promise<void>;
  editTodo?: Todo | null;
}

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: 'LOW', label: 'Low', color: 'bg-slate-800 border-slate-700 text-slate-300' },
  { key: 'MEDIUM', label: 'Medium', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  { key: 'HIGH', label: 'High', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  { key: 'URGENT', label: 'Urgent', color: 'bg-rose-500/20 border-rose-500/40 text-rose-300' }
];

export const AddTodoModal: React.FC<AddTodoModalProps> = ({ isOpen, onClose, onSave, editTodo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(45);
  const [createOccurrenceToday, setCreateOccurrenceToday] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title);
      setDescription(editTodo.description || '');
      setPriority(editTodo.priority || 'MEDIUM');
      setDueDate(editTodo.due_date || '');
      setEstimatedMinutes(editTodo.estimated_minutes || 45);
      setCreateOccurrenceToday(false);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setEstimatedMinutes(45);
      setCreateOccurrenceToday(true);
    }
  }, [editTodo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Todo title is required');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        estimated_minutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
        createOccurrenceToday
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save todo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{editTodo ? 'Edit Todo' : 'Add New Todo'}</h2>
              <p className="text-xs text-slate-400">Single task or scheduled occurrence item</p>
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
              Todo Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish FastAPI project review"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
              placeholder="Task instructions, links or checklist..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => {
                const active = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-purple-600/40 border-purple-400 text-purple-200 shadow-sm ring-1 ring-purple-400'
                        : `${p.color} opacity-70 hover:opacity-100`
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Due Date (Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. Minutes</span>
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="45"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {!editTodo && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-3">
              <input
                type="checkbox"
                id="occurrenceToday"
                checked={createOccurrenceToday}
                onChange={(e) => setCreateOccurrenceToday(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
              <label htmlFor="occurrenceToday" className="text-xs text-slate-300 cursor-pointer">
                Automatically schedule occurrence for Today on matrix
              </label>
            </div>
          )}

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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : editTodo ? 'Update Todo' : 'Create Todo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
