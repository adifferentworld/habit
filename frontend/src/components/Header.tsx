import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  User,
  Plus,
  RefreshCw,
  UploadCloud,
  Flame,
  CheckSquare,
  Sparkles,
  Clock
} from 'lucide-react';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAddHabit: () => void;
  onOpenAddTodo: () => void;
  onSync: () => void;
  onLoadBulk: () => void;
  isSyncing: boolean;
  isLoadingBulk: boolean;
  lastSyncedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenAddHabit,
  onOpenAddTodo,
  onSync,
  onLoadBulk,
  isSyncing,
  isLoadingBulk,
  lastSyncedTime
}) => {
  const { user } = useAuth();

  // Current formatted date
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Branding & Current Date Display */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-emerald-500 rounded-2xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Habit & Todo Matrix
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                  v1.0
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-indigo-200">{formattedDate}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.timezone || 'UTC'}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Sync pending offline activity logs in bulk to backend"
            >
              <UploadCloud className={`w-4 h-4 text-indigo-400 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Load Button */}
            <button
              onClick={onLoadBulk}
              disabled={isLoadingBulk}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Bulk reload dataset from backend"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoadingBulk ? 'animate-spin' : ''}`} />
              <span>{isLoadingBulk ? 'Loading...' : 'Load'}</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer"
              title="View & Edit Profile"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline truncate max-w-[100px]">{user?.nickname || user?.name || user?.username}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
