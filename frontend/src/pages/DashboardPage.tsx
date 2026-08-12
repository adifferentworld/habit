import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Habit,
  Todo,
  TodoOccurrence,
  ActivityLog,
  OverviewAnalytics,
  DailyAnalytics,
  StreakResponse,
  BulkLogItem
} from '../types';

import { Header } from '../components/Header';
import { MatrixGrid } from '../components/MatrixGrid';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { ProfileModal } from '../components/ProfileModal';
import { AddHabitModal } from '../components/AddHabitModal';
import { AddTodoModal } from '../components/AddTodoModal';
import { LogActivityModal } from '../components/LogActivityModal';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [occurrences, setOccurrences] = useState<TodoOccurrence[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([]);
  const [streak, setStreak] = useState<StreakResponse | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingBulk, setIsLoadingBulk] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    item: Habit | Todo | null;
    type: 'HABIT' | 'TODO';
  }>({
    isOpen: false,
    item: null,
    type: 'HABIT'
  });

  const [cellModal, setCellModal] = useState<{
    isOpen: boolean;
    itemTitle: string;
    itemType: 'HABIT' | 'TODO';
    habitId?: string;
    todoOccurrenceId?: string;
    activityDate: string;
    existingLogs: ActivityLog[];
  }>({
    isOpen: false,
    itemTitle: '',
    itemType: 'HABIT',
    activityDate: '',
    existingLogs: []
  });

  // Today Date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // 16 Date Array: max last 15 days + current date (Today is rightmost)
  const generate16Dates = useCallback(() => {
    const arr: string[] = [];
    for (let i = 15; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  }, []);

  const dates16 = generate16Dates();

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Bulk Load from Backend
  const handleLoadBulk = useCallback(async () => {
    setIsLoadingBulk(true);
    try {
      const data = await api.syncBulkData(16);
      setHabits(data.habits || []);
      setTodos(data.todos || []);
      setOccurrences(data.occurrences || []);
      setLogs(data.logs || []);

      // Fetch Analytics
      const [ov, da, st] = await Promise.all([
        api.getOverviewAnalytics().catch(() => null),
        api.getDailyAnalytics(dates16[0], todayStr).catch(() => []),
        api.getStreaks().catch(() => null)
      ]);

      setOverview(ov);
      setDailyAnalytics(da);
      setStreak(st);

      showToast('success', 'Data loaded successfully from server');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
    } finally {
      setIsLoadingBulk(false);
    }
  }, [dates16, todayStr]);

  useEffect(() => {
    handleLoadBulk();
  }, []);

  // Sync Pending Logs in Bulk
  const handleSyncBulk = async () => {
    setIsSyncing(true);
    try {
      const pendingStr = localStorage.getItem('pending_logs');
      const pendingLogs: BulkLogItem[] = pendingStr ? JSON.parse(pendingStr) : [];

      if (pendingLogs.length === 0) {
        // Just refresh dataset
        await handleLoadBulk();
        showToast('success', 'All logs already synchronized');
        setIsSyncing(false);
        return;
      }

      const res = await api.bulkSyncLogs(pendingLogs);
      localStorage.removeItem('pending_logs');

      await handleLoadBulk();
      showToast('success', `Synced ${res.inserted} new activity logs (${res.duplicates} duplicates skipped)`);
    } catch (err: any) {
      showToast('error', err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Habits Operations
  const handleSaveHabit = async (data: {
    title: string;
    description?: string;
    importance_score?: number;
    designated_week_days: any[];
    scheduled_time?: string;
    estimated_minutes?: number;
  }) => {
    if (editHabit) {
      await api.updateHabit(editHabit.id, data as any);
      showToast('success', 'Habit updated!');
    } else {
      await api.createHabit(data as any);
      showToast('success', 'New habit created!');
    }
    setEditHabit(null);
    await handleLoadBulk();
  };

  const handleStopHabit = async (id: string) => {
    await api.stopHabit(id);
    showToast('success', 'Habit paused');
    await handleLoadBulk();
  };

  const handleResumeHabit = async (id: string) => {
    await api.resumeHabit(id);
    showToast('success', 'Habit resumed');
    await handleLoadBulk();
  };

  const handleUpdateHabit = async (id: string, data: Partial<Habit>) => {
    await api.updateHabit(id, data);
    showToast('success', 'Habit updated!');
    await handleLoadBulk();
  };

  const handleUpdateTodo = async (id: string, data: Partial<Todo>) => {
    await api.updateTodo(id, data);
    showToast('success', 'Todo updated!');
    await handleLoadBulk();
  };

  const handleDeleteHabit = async (id: string) => {
    await api.deleteHabit(id);
    showToast('success', 'Habit deleted');
    await handleLoadBulk();
  };

  // Todos Operations
  const handleSaveTodo = async (data: {
    title: string;
    description?: string;
    priority?: any;
    due_date?: string;
    estimated_minutes?: number;
    createOccurrenceToday?: boolean;
  }) => {
    const { createOccurrenceToday, ...todoData } = data;
    if (editTodo) {
      await api.updateTodo(editTodo.id, todoData);
      showToast('success', 'Todo updated!');
    } else {
      const newTodo = await api.createTodo(todoData);
      if (createOccurrenceToday) {
        await api.createOccurrence(newTodo.id, { for_date: todayStr });
      }
      showToast('success', 'New todo created!');
    }
    setEditTodo(null);
    await handleLoadBulk();
  };

  const handleDeleteTodo = async (id: string) => {
    await api.deleteTodo(id);
    showToast('success', 'Todo deleted');
    await handleLoadBulk();
  };

  const handleDeleteLog = async (logId: string) => {
    await api.deleteLog(logId);
    showToast('success', 'Log deleted');
    await handleLoadBulk();
    // Update cell modal existing logs
    setCellModal((prev) => ({
      ...prev,
      existingLogs: prev.existingLogs.filter((l) => l.id !== logId)
    }));
  };

  const handleCreateOccurrence = async (todoId: string, forDate: string) => {
    try {
      await api.createOccurrence(todoId, { for_date: forDate });
      showToast('success', `Scheduled occurrence for ${forDate}`);
      await handleLoadBulk();
    } catch (err: any) {
      showToast('error', err.message || 'Occurrence already exists or failed to create');
    }
  };

  // Matrix Cell Click
  const handleCellClick = (
    itemTitle: string,
    itemType: 'HABIT' | 'TODO',
    habitId: string | undefined,
    todoOccurrenceId: string | undefined,
    dateStr: string,
    existingLogs: ActivityLog[]
  ) => {
    setCellModal({
      isOpen: true,
      itemTitle,
      itemType,
      habitId,
      todoOccurrenceId,
      activityDate: dateStr,
      existingLogs
    });
  };

  // Activity Log Submit
  const handleLogSubmit = async (logData: {
    type: 'HABIT' | 'TODO';
    habit_id?: string;
    todo_occurrence_id?: string;
    activity_date: string;
    score: number;
    multiplier: number;
    duration_minutes?: number;
  }) => {
    try {
      await api.createLog(logData);
      showToast('success', `Logged activity! Score: ${logData.score}`);
      await handleLoadBulk();
    } catch (err: any) {
      // Buffer log locally if network issue occurs
      const pendingStr = localStorage.getItem('pending_logs');
      const pendingLogs: BulkLogItem[] = pendingStr ? JSON.parse(pendingStr) : [];
      pendingLogs.push({ ...logData, event_id: `evt_${Date.now()}` });
      localStorage.setItem('pending_logs', JSON.stringify(pendingLogs));

      showToast('error', 'Network error. Log buffered locally. Click "Sync" to upload!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 transition-all animate-slide-down ${
            notification.type === 'success'
              ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/90 border-rose-500/40 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAddHabit={() => {
          setEditHabit(null);
          setIsAddHabitOpen(true);
        }}
        onOpenAddTodo={() => {
          setEditTodo(null);
          setIsAddTodoOpen(true);
        }}
        onSync={handleSyncBulk}
        onLoadBulk={handleLoadBulk}
        isSyncing={isSyncing}
        isLoadingBulk={isLoadingBulk}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Matrix Grid (Desktop Max 15 Days + Today) */}
        <section>
          {isLoadingBulk ? (
            <div className="p-16 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-xs text-slate-400 font-medium">Loading habit & todo matrix history...</p>
            </div>
          ) : (
            <MatrixGrid
              habits={habits}
              todos={todos}
              occurrences={occurrences}
              logs={logs}
              dates={dates16}
              todayStr={todayStr}
              onCellClick={handleCellClick}
              onItemClick={(item, type) => {
                setDetailModal({
                  isOpen: true,
                  item,
                  type
                });
              }}
              onAddHabitClick={() => {
                setEditHabit(null);
                setIsAddHabitOpen(true);
              }}
              onAddTodoClick={() => {
                setEditTodo(null);
                setIsAddTodoOpen(true);
              }}
              onCreateOccurrence={handleCreateOccurrence}
            />
          )}
        </section>

        {/* Analytics Section */}
        <section>
          <AnalyticsCharts
            overview={overview}
            daily={dailyAnalytics}
            streak={streak}
            habits={habits}
            todos={todos}
            logs={logs}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        Habit & Todo Matrix Tracker • Standalone FastAPI Backend + React Frontend
      </footer>

      {/* Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <ItemDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal((prev) => ({ ...prev, isOpen: false }))}
        item={detailModal.item}
        type={detailModal.type}
        onUpdateHabit={handleUpdateHabit}
        onUpdateTodo={handleUpdateTodo}
        onStopHabit={handleStopHabit}
        onResumeHabit={handleResumeHabit}
        onDeleteHabit={handleDeleteHabit}
        onDeleteTodo={handleDeleteTodo}
      />

      <AddHabitModal
        isOpen={isAddHabitOpen}
        onClose={() => setIsAddHabitOpen(false)}
        onSave={handleSaveHabit}
        editHabit={editHabit}
      />

      <AddTodoModal
        isOpen={isAddTodoOpen}
        onClose={() => setIsAddTodoOpen(false)}
        onSave={handleSaveTodo}
        editTodo={editTodo}
      />

      <LogActivityModal
        isOpen={cellModal.isOpen}
        onClose={() => setCellModal((prev) => ({ ...prev, isOpen: false }))}
        itemTitle={cellModal.itemTitle}
        itemType={cellModal.itemType}
        habitId={cellModal.habitId}
        todoOccurrenceId={cellModal.todoOccurrenceId}
        activityDate={cellModal.activityDate}
        isToday={cellModal.activityDate === todayStr}
        existingLogs={cellModal.existingLogs}
        onLogSubmit={handleLogSubmit}
        onDeleteLog={handleDeleteLog}
      />
    </div>
  );
};
