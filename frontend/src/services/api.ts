import {
  AuthResponse,
  User,
  Habit,
  Todo,
  TodoOccurrence,
  ActivityLog,
  OverviewAnalytics,
  DailyAnalytics,
  StreakResponse,
  HabitAnalytics,
  TodoAnalytics,
  SyncDataResponse,
  BulkLogItem
} from '../types';

const API_BASE = '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errData = await res.json();
      if (errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse<AuthResponse>(res);
  },

  async register(data: {
    username: string;
    password: string;
    name: string;
    nickname?: string;
    age?: number;
    timezone?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<User>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: getHeaders()
    });
    return handleResponse<User>(res);
  },

  async updateProfile(data: { name?: string; nickname?: string; age?: number; timezone?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<User>(res);
  },

  // Habits
  async getHabits(): Promise<Habit[]> {
    const res = await fetch(`${API_BASE}/habits`, { headers: getHeaders() });
    return handleResponse<Habit[]>(res);
  },

  async createHabit(data: {
    title: string;
    description?: string;
    importance_score?: number;
    designated_week_days: string[];
    scheduled_time?: string;
    estimated_minutes?: number;
  }): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Habit>(res);
  },

  async updateHabit(id: string, data: Partial<Habit>): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Habit>(res);
  },

  async stopHabit(id: string): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits/${id}/stop`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<Habit>(res);
  },

  async resumeHabit(id: string): Promise<Habit> {
    const res = await fetch(`${API_BASE}/habits/${id}/resume`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<Habit>(res);
  },

  async deleteHabit(id: string): Promise<{ detail: string }> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ detail: string }>(res);
  },

  // Todos
  async getTodos(): Promise<Todo[]> {
    const res = await fetch(`${API_BASE}/todos`, { headers: getHeaders() });
    return handleResponse<Todo[]>(res);
  },

  async createTodo(data: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    estimated_minutes?: number;
  }): Promise<Todo> {
    const res = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Todo>(res);
  },

  async updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Todo>(res);
  },

  async deleteTodo(id: string): Promise<{ detail: string }> {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<{ detail: string }>(res);
  },

  // Occurrences
  async createOccurrence(todoId: string, data: { for_date: string; scheduled_at?: string; estimated_minutes?: number }): Promise<TodoOccurrence> {
    const res = await fetch(`${API_BASE}/todos/${todoId}/occurrences`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<TodoOccurrence>(res);
  },

  async getTodoOccurrences(todoId: string): Promise<TodoOccurrence[]> {
    const res = await fetch(`${API_BASE}/todos/${todoId}/occurrences`, {
      headers: getHeaders()
    });
    return handleResponse<TodoOccurrence[]>(res);
  },

  async updateOccurrence(occurrenceId: string, data: { status?: string; estimated_minutes?: number }): Promise<TodoOccurrence> {
    const res = await fetch(`${API_BASE}/todo-occurrences/${occurrenceId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<TodoOccurrence>(res);
  },

  // Logs
  async createLog(data: {
    type: 'HABIT' | 'TODO';
    habit_id?: string;
    todo_occurrence_id?: string;
    activity_date: string;
    score: number;
    multiplier?: number;
    duration_minutes?: number;
  }): Promise<ActivityLog> {
    const res = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<ActivityLog>(res);
  },

  async deleteLog(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok && res.status !== 204) {
      let errorMsg = 'Failed to delete log';
      try {
        const errData = await res.json();
        if (errData.detail) errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } catch {}
      throw new Error(errorMsg);
    }
  },

  async getLogs(params?: { from_date?: string; to_date?: string; type?: string }): Promise<ActivityLog[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/logs${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return handleResponse<ActivityLog[]>(res);
  },

  // Analytics
  async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getHeaders() });
    return handleResponse<OverviewAnalytics>(res);
  },

  async getDailyAnalytics(fromDate?: string, toDate?: string): Promise<DailyAnalytics[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    const res = await fetch(`${API_BASE}/analytics/daily${params.toString() ? `?${params.toString()}` : ''}`, {
      headers: getHeaders()
    });
    return handleResponse<DailyAnalytics[]>(res);
  },

  async getStreaks(): Promise<StreakResponse> {
    const res = await fetch(`${API_BASE}/analytics/streaks`, { headers: getHeaders() });
    return handleResponse<StreakResponse>(res);
  },

  async getHabitAnalytics(habitId: string): Promise<HabitAnalytics> {
    const res = await fetch(`${API_BASE}/analytics/habits/${habitId}`, { headers: getHeaders() });
    return handleResponse<HabitAnalytics>(res);
  },

  async getTodoAnalytics(todoId: string): Promise<TodoAnalytics> {
    const res = await fetch(`${API_BASE}/analytics/todos/${todoId}`, { headers: getHeaders() });
    return handleResponse<TodoAnalytics>(res);
  },

  // Data Sync
  async syncBulkData(days = 16): Promise<SyncDataResponse> {
    const res = await fetch(`${API_BASE}/sync?days=${days}`, { headers: getHeaders() });
    return handleResponse<SyncDataResponse>(res);
  },

  async bulkSyncLogs(logs: BulkLogItem[]): Promise<{ inserted: number; duplicates: number }> {
    const res = await fetch(`${API_BASE}/sync/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ logs })
    });
    return handleResponse<{ inserted: number; duplicates: number }>(res);
  }
};
