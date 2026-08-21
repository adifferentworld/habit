import React, { useState } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { TagFilterBar } from './components/TagFilterBar';
import { TrackerMatrix } from './components/TrackerMatrix';
import { ChartsPanel } from './components/ChartsPanel';
import { CreateTodoModal } from './components/modals/CreateTodoModal';
import { CreateHabitModal } from './components/modals/CreateHabitModal';
import { CreateTagModal } from './components/modals/CreateTagModal';
import { EditItemModal } from './components/modals/EditItemModal';
import { Sparkles, Heart, Stethoscope, CheckCircle2, Info, Flame } from 'lucide-react';

const TrackerAppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<'matrix' | 'charts' | 'all'>('all');
  const { isLoading, notification } = useTracker();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-pink-950 p-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-400 to-purple-400 text-white shadow-xl animate-bounce">
          <Stethoscope className="w-8 h-8" />
        </div>
        <p className="mt-4 text-sm font-bold text-pink-600 dark:text-pink-300 animate-pulse">
          Opening Your Study Journal... 🩺✨
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-[#fce7f3] via-[#fae8ff] to-[#e0e7ff] dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sleek Interface Ambient Glow Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-pink-300 dark:bg-pink-600/20 rounded-full blur-[120px] opacity-45 pointer-events-none -z-10" />
      <div className="fixed -bottom-24 -right-24 w-[420px] h-[420px] bg-blue-300 dark:bg-indigo-600/20 rounded-full blur-[130px] opacity-45 pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-purple-200/50 dark:bg-purple-900/15 rounded-full blur-[140px] opacity-30 pointer-events-none -z-10" />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel bg-white/90 dark:bg-slate-900/90 shadow-2xl border border-white/80 dark:border-white/10 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">
            {notification.type === 'celebrate' ? (
              <Sparkles className="w-4 h-4 text-pink-500 animate-spin" />
            ) : notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Info className="w-4 h-4 text-indigo-500" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {/* Header */}
        <Header />

        {/* Motivation & Today Progress Stats */}
        <StatsBanner />

        {/* Tag Filters, Search, and Date Controls */}
        <TagFilterBar activeView={activeView} setActiveView={setActiveView} />

        {/* Main Content Area: Matrix, Charts, or Both */}
        <main className="space-y-6">
          {(activeView === 'all' || activeView === 'matrix') && (
            <section id="matrix-section">
              <TrackerMatrix />
            </section>
          )}

          {(activeView === 'all' || activeView === 'charts') && (
            <section id="charts-section">
              <ChartsPanel />
            </section>
          )}
        </main>

        {/* Sleek Interface Footer */}
        <footer className="mt-12 py-6 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-t border-white/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">© 2026 Progress Tracker</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready to study • NEET 2027</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>Future Doctor Success Path 🩺✨</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CreateTodoModal />
      <CreateHabitModal />
      <CreateTagModal />
      <EditItemModal />
    </div>
  );
};

export default function App() {
  return (
    <TrackerProvider>
      <TrackerAppContent />
    </TrackerProvider>
  );
}
