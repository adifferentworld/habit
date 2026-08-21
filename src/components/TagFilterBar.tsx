import React from 'react';
import { Filter, Search, Calendar, ChevronLeft, ChevronRight, Sparkles, X, LayoutGrid, BarChart2 } from 'lucide-react';
import { useTracker } from '../context/TrackerContext';

interface TagFilterBarProps {
  activeView: 'matrix' | 'charts' | 'all';
  setActiveView: (view: 'matrix' | 'charts' | 'all') => void;
}

export const TagFilterBar: React.FC<TagFilterBarProps> = ({ activeView, setActiveView }) => {
  const {
    tags,
    selectedTagId,
    setSelectedTagId,
    searchQuery,
    setSearchQuery,
    viewDaysCount,
    setViewDaysCount,
    anchorDate,
    setAnchorDate,
  } = useTracker();

  // Navigate dates
  const handleShiftDate = (days: number) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + days);
    setAnchorDate(next);
  };

  const handleResetToToday = () => {
    setAnchorDate(new Date());
  };

  const isToday =
    anchorDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-4 mb-6 p-4 md:p-5 rounded-3xl backdrop-blur-md bg-white/40 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 shadow-lg shadow-pink-200/10">
      {/* Top row: View Switcher, Search Input, and Date Pagination */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 p-1 rounded-2xl border border-white/80 dark:border-slate-700/60 shadow-xs">
          <button
            id="view-all-tab"
            onClick={() => setActiveView('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combined</span>
          </button>
          <button
            id="view-matrix-tab"
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'matrix'
                ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-300'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Matrix</span>
          </button>
          <button
            id="view-charts-tab"
            onClick={() => setActiveView('charts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'charts'
                ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Charts</span>
          </button>
        </div>

        {/* Middle: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-input"
            type="text"
            placeholder="Search physics formulas, NCERT topics, tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 text-xs md:text-sm rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Date navigation & span selector */}
        <div className="flex items-center gap-2">
          {/* Days span (7 / 14 / 30) */}
          <div className="flex items-center bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/80 dark:border-slate-700/60 p-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                id={`span-${days}-btn`}
                onClick={() => setViewDaysCount(days)}
                className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                  viewDaysCount === days
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'hover:text-pink-500'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/80 dark:border-slate-700/60 p-0.5">
            <button
              id="prev-date-btn"
              onClick={() => handleShiftDate(-viewDaysCount)}
              title="View earlier dates"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:bg-white/60 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="today-date-btn"
              onClick={handleResetToToday}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                isToday
                  ? 'bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-pink-600'
              }`}
            >
              Today
            </button>

            <button
              id="next-date-btn"
              onClick={() => handleShiftDate(viewDaysCount)}
              title="View later dates"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:bg-white/60 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Quick Filters Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
          Quick Filters:
        </span>

        {/* All Pill */}
        <button
          id="filter-tag-all"
          onClick={() => setSelectedTagId(null)}
          className={`shrink-0 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs ${
            selectedTagId === null
              ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 ring-2 ring-pink-400/40'
              : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-white/80 dark:border-slate-700'
          }`}
        >
          All Items
        </button>

        {/* Dynamic Tag Pills with Sleek Translucent Style */}
        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          return (
            <button
              key={tag.id}
              id={`filter-tag-${tag.id}`}
              onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border shadow-xs ${
                isSelected
                  ? 'text-white ring-2 ring-pink-400/50'
                  : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              style={{
                backgroundColor: isSelected ? tag.color : undefined,
                borderColor: isSelected ? tag.color : `${tag.color}40`,
                color: !isSelected ? undefined : '#ffffff',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
              />
              <span>#{tag.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
