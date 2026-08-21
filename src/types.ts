export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TodoTemplate {
  id: string;
  title: string;
  tagIds: string[];
  isRepeatable: boolean;
  createdAt: string;
  notes?: string;
}

export interface TodoInstance {
  id: string;
  todoTemplateId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  tagIds: string[];
  frequency: 'daily' | 'weeklyDays';
  daysOfWeek: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  targetPerWeek?: number;
  createdAt: string;
  notes?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ChartDimension = 'habit' | 'todo' | 'tag' | 'neet_balance';

export type AppTheme = 'light' | 'dark';

export interface HabitStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0 to 100%
  completedToday: boolean;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'celebrate';
}
