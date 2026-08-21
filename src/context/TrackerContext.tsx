import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  getAllHabitLogs,
  getAllHabits,
  getAllTags,
  getAllTodoInstances,
  getAllTodoTemplates,
  saveHabit,
  saveHabitLog,
  saveTag,
  saveTodoInstance,
  saveTodoTemplate,
  deleteHabitFromDB,
  deleteTagFromDB,
  deleteTodoInstanceFromDB,
  deleteTodoTemplateFromDB,
  seedStarterPack,
  clearAllLocalData,
} from '../lib/db';
import { AppNotification, AppTheme, Habit, HabitLog, HabitStreakInfo, Tag, TodoInstance, TodoTemplate } from '../types';

interface TrackerContextValue {
  tags: Tag[];
  habits: Habit[];
  habitLogs: HabitLog[];
  todoTemplates: TodoTemplate[];
  todoInstances: TodoInstance[];
  isLoading: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewDaysCount: 7 | 14 | 30;
  setViewDaysCount: (count: 7 | 14 | 30) => void;
  anchorDate: Date;
  setAnchorDate: (d: Date) => void;
  
  // Modals
  isCreateTodoOpen: boolean;
  setIsCreateTodoOpen: (v: boolean) => void;
  isCreateHabitOpen: boolean;
  setIsCreateHabitOpen: (v: boolean) => void;
  isCreateTagOpen: boolean;
  setIsCreateTagOpen: (v: boolean) => void;
  editingItem: { type: 'habit' | 'todo' | 'tag'; item: any } | null;
  setEditingItem: (item: { type: 'habit' | 'todo' | 'tag'; item: any } | null) => void;
  
  // Tag CRUD
  createTag: (name: string, color: string) => Promise<Tag>;
  updateTag: (tag: Tag) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Todo CRUD
  createTodo: (
    title: string,
    tagIds: string[],
    isRepeatable: boolean,
    targetDate: string,
    notes?: string,
    existingTemplateId?: string
  ) => Promise<void>;
  updateTodoTemplate: (template: TodoTemplate) => Promise<void>;
  deleteTodoTemplate: (id: string) => Promise<void>;
  toggleTodoInstance: (templateId: string, dateStr: string) => Promise<void>;
  deleteTodoInstance: (instanceId: string) => Promise<void>;

  // Habit CRUD
  createHabit: (
    title: string,
    tagIds: string[],
    frequency: 'daily' | 'weeklyDays',
    daysOfWeek: number[],
    notes?: string
  ) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitLog: (habitId: string, dateStr: string) => Promise<void>;

  // Metrics
  calculateHabitStreak: (habitId: string) => HabitStreakInfo;
  todayCompletionStats: {
    totalItems: number;
    completedItems: number;
    percentage: number;
  };
  overallStats: {
    totalHabits: number;
    totalActiveTodos: number;
    totalCompletionsAllTime: number;
    bestOverallStreak: number;
  };

  // Sparkles & Alerts
  triggerSparkles: (origin?: { x: number; y: number }) => void;
  notification: AppNotification | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'celebrate') => void;

  // Reset/Seed
  reloadAllData: () => Promise<void>;
  resetToStarterPack: () => Promise<void>;
  clearEverything: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [todoTemplates, setTodoTemplates] = useState<TodoTemplate[]>([]);
  const [todoInstances, setTodoInstances] = useState<TodoInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Navigation
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDaysCount, setViewDaysCount] = useState<7 | 14 | 30>(7);
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Theme
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('progress_tracker_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Modals
  const [isCreateTodoOpen, setIsCreateTodoOpen] = useState(false);
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'habit' | 'todo' | 'tag'; item: any } | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<AppNotification | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'celebrate' = 'success') => {
    const id = Date.now().toString();
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const triggerSparkles = useCallback((origin?: { x: number; y: number }) => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: origin || { y: 0.7, x: 0.5 },
        colors: ['#F472B6', '#EC4899', '#C084FC', '#38BDF8', '#FCD34D', '#A78BFA'],
        ticks: 180,
        gravity: 0.9,
        scalar: 0.9,
      });
    } catch {
      // safe fallback
    }
  }, []);

  // Synchronize Theme class to html/body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('progress_tracker_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('progress_tracker_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load from IndexedDB
  const reloadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Auto-seed starter pack if totally fresh
      const seeded = await seedStarterPack(false);
      
      const [allTags, allHabits, allHabitLogs, allTodoTemplates, allTodoInstances] = await Promise.all([
        getAllTags(),
        getAllHabits(),
        getAllHabitLogs(),
        getAllTodoTemplates(),
        getAllTodoInstances(),
      ]);

      setTags(allTags);
      setHabits(allHabits);
      setHabitLogs(allHabitLogs);
      setTodoTemplates(allTodoTemplates);
      setTodoInstances(allTodoInstances);

      if (seeded) {
        showNotification('Welcome! NEET Study Starter Pack loaded with Physics, Chem, Bio & Revision habits 🩺✨', 'celebrate');
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    reloadAllData();
  }, [reloadAllData]);

  // ----------------- TAGS -----------------
  const createTag = async (name: string, color: string): Promise<Tag> => {
    const newTag: Tag = {
      id: 'tag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      color: color || '#EC4899',
      createdAt: new Date().toISOString(),
    };
    await saveTag(newTag);
    setTags((prev) => [...prev, newTag]);
    showNotification(`Added tag "${newTag.name}" 🌸`);
    return newTag;
  };

  const updateTag = async (tag: Tag) => {
    await saveTag(tag);
    setTags((prev) => prev.map((t) => (t.id === tag.id ? tag : t)));
    showNotification(`Updated tag "${tag.name}" ✨`);
  };

  const deleteTag = async (id: string) => {
    await deleteTagFromDB(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    // Clean tag from habits and todos in local state
    setHabits((prev) => prev.map((h) => ({ ...h, tagIds: h.tagIds.filter((tId) => tId !== id) })));
    setTodoTemplates((prev) => prev.map((t) => ({ ...t, tagIds: t.tagIds.filter((tId) => tId !== id) })));
    showNotification('Tag removed 🗑️', 'info');
  };

  // ----------------- HABITS -----------------
  const createHabit = async (
    title: string,
    tagIds: string[],
    frequency: 'daily' | 'weeklyDays',
    daysOfWeek: number[],
    notes?: string
  ) => {
    const newHabit: Habit = {
      id: 'habit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      tagIds,
      frequency,
      daysOfWeek: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
      createdAt: new Date().toISOString(),
      notes,
    };
    await saveHabit(newHabit);
    setHabits((prev) => [...prev, newHabit]);
    showNotification(`New Habit Created: "${newHabit.title}" 🩺✨`, 'celebrate');
    triggerSparkles();
  };

  const updateHabit = async (habit: Habit) => {
    await saveHabit(habit);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
    showNotification(`Habit updated: "${habit.title}" ✨`);
  };

  const deleteHabit = async (id: string) => {
    await deleteHabitFromDB(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setHabitLogs((prev) => prev.filter((l) => l.habitId !== id));
    showNotification('Habit deleted 🗑️', 'info');
  };

  const toggleHabitLog = async (habitId: string, dateStr: string) => {
    const existingLog = habitLogs.find((l) => l.habitId === habitId && l.date === dateStr);
    const newCompleted = existingLog ? !existingLog.completed : true;

    const logToSave: HabitLog = {
      id: existingLog?.id || `log-${habitId}-${dateStr}`,
      habitId,
      date: dateStr,
      completed: newCompleted,
    };

    await saveHabitLog(logToSave);
    setHabitLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habitId === habitId && l.date === dateStr));
      return [...filtered, logToSave];
    });

    if (newCompleted) {
      triggerSparkles();
      const habit = habits.find((h) => h.id === habitId);
      showNotification(`Completed: "${habit?.title || 'Habit'}" for ${dateStr}! 🔥`, 'celebrate');
    }
  };

  // ----------------- TODOS -----------------
  const createTodo = async (
    title: string,
    tagIds: string[],
    isRepeatable: boolean,
    targetDate: string,
    notes?: string,
    existingTemplateId?: string
  ) => {
    let templateId = existingTemplateId;

    // Check if an existing template with exact title exists if not provided
    if (!templateId) {
      const match = todoTemplates.find((t) => t.title.toLowerCase() === title.trim().toLowerCase());
      if (match) {
        templateId = match.id;
      }
    }

    if (!templateId) {
      // Create new template
      const newTemplate: TodoTemplate = {
        id: 'tmpl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: title.trim(),
        tagIds,
        isRepeatable,
        createdAt: new Date().toISOString(),
        notes,
      };
      await saveTodoTemplate(newTemplate);
      setTodoTemplates((prev) => [...prev, newTemplate]);
      templateId = newTemplate.id;
    }

    // Check if instance for this date already exists
    const existingInstance = todoInstances.find(
      (inst) => inst.todoTemplateId === templateId && inst.date === targetDate
    );

    if (!existingInstance) {
      const newInstance: TodoInstance = {
        id: 'inst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        todoTemplateId: templateId,
        date: targetDate,
        completed: false,
      };
      await saveTodoInstance(newInstance);
      setTodoInstances((prev) => [...prev, newInstance]);
      showNotification(`Task scheduled for ${targetDate} 🎯`);
    } else {
      showNotification(`Task already scheduled on ${targetDate}`, 'info');
    }
  };

  const updateTodoTemplate = async (template: TodoTemplate) => {
    await saveTodoTemplate(template);
    setTodoTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
    showNotification(`Task template updated: "${template.title}" ✨`);
  };

  const deleteTodoTemplate = async (id: string) => {
    await deleteTodoTemplateFromDB(id);
    setTodoTemplates((prev) => prev.filter((t) => t.id !== id));
    setTodoInstances((prev) => prev.filter((i) => i.todoTemplateId !== id));
    showNotification('Task template removed 🗑️', 'info');
  };

  const toggleTodoInstance = async (templateId: string, dateStr: string) => {
    const existingInstance = todoInstances.find(
      (i) => i.todoTemplateId === templateId && i.date === dateStr
    );

    if (existingInstance) {
      const updated: TodoInstance = {
        ...existingInstance,
        completed: !existingInstance.completed,
        completedAt: !existingInstance.completed ? new Date().toISOString() : undefined,
      };
      await saveTodoInstance(updated);
      setTodoInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      
      if (updated.completed) {
        triggerSparkles();
        const tmpl = todoTemplates.find((t) => t.id === templateId);
        showNotification(`Goal accomplished: "${tmpl?.title || 'Task'}"! 🩺✨`, 'celebrate');
      }
    } else {
      // Create and mark completed instance for this date
      const newInstance: TodoInstance = {
        id: 'inst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        todoTemplateId: templateId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      await saveTodoInstance(newInstance);
      setTodoInstances((prev) => [...prev, newInstance]);
      triggerSparkles();
      const tmpl = todoTemplates.find((t) => t.id === templateId);
      showNotification(`Goal accomplished: "${tmpl?.title || 'Task'}"! 🩺✨`, 'celebrate');
    }
  };

  const deleteTodoInstance = async (instanceId: string) => {
    await deleteTodoInstanceFromDB(instanceId);
    setTodoInstances((prev) => prev.filter((i) => i.id !== instanceId));
    showNotification('Instance removed', 'info');
  };

  // ----------------- STREAK CALCULATION -----------------
  const calculateHabitStreak = useCallback(
    (habitId: string): HabitStreakInfo => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) {
        return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, completionRate: 0, completedToday: false };
      }

      const logs = habitLogs.filter((l) => l.habitId === habitId && l.completed);
      const completedDatesSet = new Set(logs.map((l) => l.date));
      const totalCompletions = logs.length;

      // Get today YYYY-MM-DD
      const now = new Date();
      const formatYMD = (d: Date) => d.toISOString().split('T')[0];
      const todayStr = formatYMD(now);
      const completedToday = completedDatesSet.has(todayStr);

      // Walk backward day by day to count current streak
      let currentStreak = 0;
      let checkDate = new Date(now);

      // Check if today was scheduled; if today is not completed yet, start check from yesterday
      if (!completedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = formatYMD(checkDate);
        const dayOfWeek = checkDate.getDay();
        const isScheduledDay = habit.frequency === 'daily' || habit.daysOfWeek.includes(dayOfWeek);

        if (isScheduledDay) {
          if (completedDatesSet.has(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        } else {
          // Skip unscheduled days without breaking streak
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Safeguard walk limit (1 year max)
        if (currentStreak > 365) break;
      }

      // Calculate Longest Streak by sorting dates
      const sortedCompletedDates = Array.from(completedDatesSet).sort();
      let longestStreak = 0;
      let tempStreak = 0;
      let prevValidDate: Date | null = null;

      for (const dStr of sortedCompletedDates) {
        const curr = new Date(dStr + 'T00:00:00');
        if (!prevValidDate) {
          tempStreak = 1;
        } else {
          // Count gap days
          let gapScheduled = false;
          let testDate = new Date(prevValidDate);
          testDate.setDate(testDate.getDate() + 1);

          while (formatYMD(testDate) < dStr) {
            const dayOfWeek = testDate.getDay();
            if (habit.frequency === 'daily' || habit.daysOfWeek.includes(dayOfWeek)) {
              gapScheduled = true;
              break;
            }
            testDate.setDate(testDate.getDate() + 1);
          }

          if (!gapScheduled) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevValidDate = curr;
      }

      if (currentStreak > longestStreak) longestStreak = currentStreak;

      // Completion Rate over last 30 scheduled days
      let scheduledDaysCount = 0;
      let completedInSample = 0;
      const sampleDate = new Date(now);

      for (let i = 0; i < 30; i++) {
        const dayOfWeek = sampleDate.getDay();
        const isScheduled = habit.frequency === 'daily' || habit.daysOfWeek.includes(dayOfWeek);
        if (isScheduled) {
          scheduledDaysCount++;
          if (completedDatesSet.has(formatYMD(sampleDate))) {
            completedInSample++;
          }
        }
        sampleDate.setDate(sampleDate.getDate() - 1);
      }

      const completionRate = scheduledDaysCount > 0 ? Math.round((completedInSample / scheduledDaysCount) * 100) : 0;

      return {
        currentStreak,
        longestStreak,
        totalCompletions,
        completionRate,
        completedToday,
      };
    },
    [habits, habitLogs]
  );

  // ----------------- TODAY STATS -----------------
  const todayCompletionStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayOfWeek = new Date().getDay();

    // Scheduled habits today
    const scheduledHabits = habits.filter(
      (h) => h.frequency === 'daily' || h.daysOfWeek.includes(todayDayOfWeek)
    );
    const completedHabitsCount = scheduledHabits.filter((h) =>
      habitLogs.some((l) => l.habitId === h.id && l.date === todayStr && l.completed)
    ).length;

    // Todos scheduled for today or active instances
    const todayTodoInstances = todoInstances.filter((i) => i.date === todayStr);
    const completedTodosCount = todayTodoInstances.filter((i) => i.completed).length;

    const totalItems = scheduledHabits.length + todayTodoInstances.length;
    const completedItems = completedHabitsCount + completedTodosCount;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return { totalItems, completedItems, percentage };
  }, [habits, habitLogs, todoInstances]);

  // ----------------- OVERALL STATS -----------------
  const overallStats = useMemo(() => {
    const totalHabits = habits.length;
    const totalActiveTodos = todoTemplates.length;
    const totalHabitCompletions = habitLogs.filter((l) => l.completed).length;
    const totalTodoCompletions = todoInstances.filter((i) => i.completed).length;
    const totalCompletionsAllTime = totalHabitCompletions + totalTodoCompletions;

    let bestOverallStreak = 0;
    for (const h of habits) {
      const streak = calculateHabitStreak(h.id);
      if (streak.longestStreak > bestOverallStreak) {
        bestOverallStreak = streak.longestStreak;
      }
    }

    return {
      totalHabits,
      totalActiveTodos,
      totalCompletionsAllTime,
      bestOverallStreak,
    };
  }, [habits, todoTemplates, habitLogs, todoInstances, calculateHabitStreak]);

  // Reset to starter pack
  const resetToStarterPack = async () => {
    await seedStarterPack(true);
    await reloadAllData();
    showNotification('Restored NEET Aspirant Starter Pack 🩺🌸', 'celebrate');
    triggerSparkles();
  };

  const clearEverything = async () => {
    await clearAllLocalData();
    await reloadAllData();
    showNotification('Cleared all tracker data', 'info');
  };

  return (
    <TrackerContext.Provider
      value={{
        tags,
        habits,
        habitLogs,
        todoTemplates,
        todoInstances,
        isLoading,
        theme,
        toggleTheme,
        selectedTagId,
        setSelectedTagId,
        searchQuery,
        setSearchQuery,
        viewDaysCount,
        setViewDaysCount,
        anchorDate,
        setAnchorDate,
        isCreateTodoOpen,
        setIsCreateTodoOpen,
        isCreateHabitOpen,
        setIsCreateHabitOpen,
        isCreateTagOpen,
        setIsCreateTagOpen,
        editingItem,
        setEditingItem,
        createTag,
        updateTag,
        deleteTag,
        createTodo,
        updateTodoTemplate,
        deleteTodoTemplate,
        toggleTodoInstance,
        deleteTodoInstance,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabitLog,
        calculateHabitStreak,
        todayCompletionStats,
        overallStats,
        triggerSparkles,
        notification,
        showNotification,
        reloadAllData,
        resetToStarterPack,
        clearEverything,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
