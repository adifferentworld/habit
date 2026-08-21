import React, { useState, useMemo } from 'react';
import {
  X,
  CheckSquare,
  Plus,
  Tag as TagIcon,
  Check,
  Calendar,
  Sparkles,
  Repeat,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { TodoTemplate } from '../../types';

export const CreateTodoModal: React.FC = () => {
  const {
    isCreateTodoOpen,
    setIsCreateTodoOpen,
    setIsCreateTagOpen,
    tags,
    todoTemplates,
    createTodo,
    anchorDate,
  } = useTracker();

  const [titleInput, setTitleInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TodoTemplate | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isCreateTodoOpen) return null;

  // Filter templates matching input
  const matchingTemplates = todoTemplates.filter((t) =>
    t.title.toLowerCase().includes(titleInput.toLowerCase().trim())
  );

  const handleSelectTemplate = (template: TodoTemplate) => {
    setSelectedTemplate(template);
    setTitleInput(template.title);
    setSelectedTagIds(template.tagIds || []);
    setIsRepeatable(template.isRepeatable || false);
    if (template.notes) setNotes(template.notes);
    setIsDropdownOpen(false);
  };

  const handleTitleChange = (val: string) => {
    setTitleInput(val);
    setSelectedTemplate(null);
    setIsDropdownOpen(true);
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    await createTodo(
      titleInput.trim(),
      selectedTagIds,
      isRepeatable,
      targetDate,
      notes.trim() || undefined,
      selectedTemplate?.id
    );

    // Reset
    setTitleInput('');
    setSelectedTemplate(null);
    setSelectedTagIds([]);
    setIsRepeatable(false);
    setNotes('');
    setIsCreateTodoOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-white/95 dark:bg-zinc-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-purple-200/80 dark:border-purple-900/60 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsCreateTodoOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-pink-100/50 dark:hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-heading">
              Schedule Task / Test Goal 🩺
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Log a revision test or select a previously saved task template
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title with Autocomplete Dropdown */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Task Title (Autocomplete or Type New)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Botany Cell Biology Test, Physics Formula Revision..."
                value={titleInput}
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-purple-200 dark:border-purple-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-purple-200 dark:border-purple-800 p-1 divide-y divide-purple-100 dark:divide-zinc-700 text-xs">
                {matchingTemplates.length > 0 && (
                  <div className="p-1">
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 block">
                      Saved Templates (Select to Log Instance):
                    </span>
                    {matchingTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t)}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/60 flex items-center justify-between text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <span className="font-semibold truncate">{t.title}</span>
                        <span className="text-[10px] text-purple-500 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded-md">
                          {t.isRepeatable ? 'Recurring' : 'One-time'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {titleInput.trim() && !matchingTemplates.some((t) => t.title.toLowerCase() === titleInput.trim().toLowerCase()) && (
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create new template: "{titleInput.trim()}"</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tag Selector */}
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

            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-purple-100 dark:border-purple-900/40 min-h-[44px]">
              {tags.length === 0 ? (
                <span className="text-xs text-slate-400">No tags available yet.</span>
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
                          ? 'text-white ring-2 ring-purple-400/50 shadow-sm'
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

          {/* Date & Repeatable Toggle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Target Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-purple-200 dark:border-purple-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>
            </div>

            {/* Repeatable Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Task Recurrence
              </label>
              <button
                type="button"
                onClick={() => setIsRepeatable(!isRepeatable)}
                className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isRepeatable
                    ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-purple-900 hover:bg-purple-50'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{isRepeatable ? 'Recurring / Multi-day' : 'One-time Specific Goal'}</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Syllabus Chapter / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 8 Cell Biology, solve 45 minutes strictly with timer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-purple-200 dark:border-purple-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-100 dark:border-purple-900/40">
            <button
              type="button"
              onClick={() => setIsCreateTodoOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!titleInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Schedule Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
