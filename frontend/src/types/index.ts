export interface User {
  id: string;
  username: string;
  name: string;
  nickname?: string;
  age?: number;
  timezone: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  importance_score: number;
  status: 'ACTIVE' | 'STOPPED' | 'ARCHIVED';
  designated_week_days: WeekDay[];
  started_at: string;
  stopped_at?: string;
  scheduled_time?: string;
  estimated_minutes?: number;
  scheduled_days: number;
  completed_days: number;
  progress_score: number;
  created_at: string;
  updated_at: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  due_date?: string;
  estimated_minutes?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  scheduled_count: number;
  completed_count: number;
  progress_score: number;
  created_at: string;
  updated_at: string;
}

export interface TodoOccurrence {
  id: string;
  todo_id: string;
  for_date: string;
  scheduled_at?: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  estimated_minutes?: number;
  created_at: string;
  updated_at: string;
  todo_title?: string;
}

export interface ActivityLog {
  id: string;
  event_id?: string;
  user_id: string;
  type: 'HABIT' | 'TODO';
  habit_id?: string;
  todo_occurrence_id?: string;
  activity_date: string;
  performed_at: string;
  score: number; // 1-10
  multiplier: number;
  duration_minutes?: number;
  created_at: string;
}

export interface OverviewAnalytics {
  total_habits: number;
  total_todos: number;
  total_activity_logs: number;
  total_minutes_logged: number;
  overall_progress: number;
  overall_average_score: number;
}

export interface DailyAnalytics {
  date: string;
  log_count: number;
  total_minutes: number;
  average_score: number;
  total_weighted_score: number;
}

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
}

export interface HabitAnalytics {
  habit_id: string;
  title: string;
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  total_minutes: number;
  average_score: number;
  progress_score: number;
}

export interface TodoAnalytics {
  todo_id: string;
  title: string;
  total_occurrences: number;
  completed_occurrences: number;
  completion_rate: number;
  total_minutes: number;
  average_score: number;
  progress_score: number;
}

export interface SyncDataResponse {
  user: User;
  habits: Habit[];
  todos: Todo[];
  occurrences: TodoOccurrence[];
  logs: ActivityLog[];
}

export interface BulkLogItem {
  type: 'HABIT' | 'TODO';
  habit_id?: string;
  todo_occurrence_id?: string;
  activity_date: string;
  score: number;
  multiplier?: number;
  duration_minutes?: number;
  event_id?: string;
}
