import React from 'react';
import { Sparkles, Plus, Tag as TagIcon, CheckSquare, HeartHandshake, Sun, Moon, Stethoscope, RefreshCw, Flame } from 'lucide-react';
import { useTracker } from '../context/TrackerContext';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    setIsCreateTodoOpen,
    setIsCreateHabitOpen,
    setIsCreateTagOpen,
    resetToStarterPack,
    todayCompletionStats,
    overallStats,
  } = useTracker();

  return (
    <header className="relative w-full z-20 pb-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-5 rounded-3xl backdrop-blur-md bg-white/40 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 shadow-lg shadow-pink-200/20 dark:shadow-slate-950/30">
        {/* Left: Brand & NEET Success Path Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-pink-400/25 text-white font-bold text-lg shrink-0">
            <span>✨</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-indigo-600 dark:from-pink-300 dark:to-indigo-300 tracking-tight font-heading">
                Success Path
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100/70 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200/70 dark:border-pink-800/50">
                <Sparkles className="w-3 h-3 text-pink-500" />
                NEET 2027
              </span>
            </div>
            <p className="text-xs font-medium text-pink-600 dark:text-pink-300 opacity-80">
              Future Doctor Journal • Daily habit matrix & task planner 🩺
            </p>
          </div>
        </div>

        {/* Right: Sleek Action Buttons & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5 w-full md:w-auto">
          {/* Starter Pack button */}
          <button
            id="starter-pack-btn"
            onClick={() => resetToStarterPack()}
            title="Reload NEET Subjects & Question Goals"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-pink-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-pink-500" />
            <span className="hidden sm:inline">NEET Preset</span>
            <span className="sm:hidden">Preset</span>
          </button>

          {/* New Tag */}
          <button
            id="create-tag-btn"
            onClick={() => setIsCreateTagOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-300 border border-pink-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>+ Tag</span>
          </button>

          {/* New Habit */}
          <button
            id="create-habit-btn"
            onClick={() => setIsCreateHabitOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold text-pink-600 dark:text-pink-300 border border-pink-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-pink-500" />
            <span>+ New Habit</span>
          </button>

          {/* New Todo / Goal */}
          <button
            id="create-todo-btn"
            onClick={() => setIsCreateTodoOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-2xl text-xs font-bold text-white shadow-md shadow-pink-200 dark:shadow-pink-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Today's Goal</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="p-2 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 rounded-2xl border border-pink-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
