import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Habit, HabitLog, Tag, TodoInstance, TodoTemplate } from '../types';

interface ProgressTrackerDB extends DBSchema {
  tags: {
    key: string;
    value: Tag;
    indexes: { 'by-name': string };
  };
  todoTemplates: {
    key: string;
    value: TodoTemplate;
    indexes: { 'by-title': string };
  };
  todoInstances: {
    key: string;
    value: TodoInstance;
    indexes: {
      'by-template': string;
      'by-date': string;
      'by-template-and-date': [string, string];
    };
  };
  habits: {
    key: string;
    value: Habit;
    indexes: { 'by-title': string };
  };
  habitLogs: {
    key: string;
    value: HabitLog;
    indexes: {
      'by-habit': string;
      'by-date': string;
      'by-habit-and-date': [string, string];
    };
  };
}

const DB_NAME = 'NeetProgressTrackerDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ProgressTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ProgressTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ProgressTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagStore.createIndex('by-name', 'name');
        }

        // Todo Templates store
        if (!db.objectStoreNames.contains('todoTemplates')) {
          const templateStore = db.createObjectStore('todoTemplates', { keyPath: 'id' });
          templateStore.createIndex('by-title', 'title');
        }

        // Todo Instances store
        if (!db.objectStoreNames.contains('todoInstances')) {
          const instanceStore = db.createObjectStore('todoInstances', { keyPath: 'id' });
          instanceStore.createIndex('by-template', 'todoTemplateId');
          instanceStore.createIndex('by-date', 'date');
          instanceStore.createIndex('by-template-and-date', ['todoTemplateId', 'date']);
        }

        // Habits store
        if (!db.objectStoreNames.contains('habits')) {
          const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
          habitStore.createIndex('by-title', 'title');
        }

        // Habit Logs store
        if (!db.objectStoreNames.contains('habitLogs')) {
          const habitLogStore = db.createObjectStore('habitLogs', { keyPath: 'id' });
          habitLogStore.createIndex('by-habit', 'habitId');
          habitLogStore.createIndex('by-date', 'date');
          habitLogStore.createIndex('by-habit-and-date', ['habitId', 'date']);
        }
      },
    });
  }
  return dbPromise;
}

// ----------------- TAGS CRUD -----------------
export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  return db.getAll('tags');
}

export async function saveTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.put('tags', tag);
}

export async function deleteTagFromDB(tagId: string): Promise<void> {
  const db = await getDB();
  await db.delete('tags', tagId);
}

// ----------------- TODO TEMPLATES CRUD -----------------
export async function getAllTodoTemplates(): Promise<TodoTemplate[]> {
  const db = await getDB();
  return db.getAll('todoTemplates');
}

export async function saveTodoTemplate(template: TodoTemplate): Promise<void> {
  const db = await getDB();
  await db.put('todoTemplates', template);
}

export async function deleteTodoTemplateFromDB(templateId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['todoTemplates', 'todoInstances'], 'readwrite');
  await tx.objectStore('todoTemplates').delete(templateId);

  // Clean up related instances
  const instanceIndex = tx.objectStore('todoInstances').index('by-template');
  let cursor = await instanceIndex.openCursor(templateId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ----------------- TODO INSTANCES CRUD -----------------
export async function getAllTodoInstances(): Promise<TodoInstance[]> {
  const db = await getDB();
  return db.getAll('todoInstances');
}

export async function saveTodoInstance(instance: TodoInstance): Promise<void> {
  const db = await getDB();
  await db.put('todoInstances', instance);
}

export async function deleteTodoInstanceFromDB(instanceId: string): Promise<void> {
  const db = await getDB();
  await db.delete('todoInstances', instanceId);
}

// ----------------- HABITS CRUD -----------------
export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDB();
  return db.getAll('habits');
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await getDB();
  await db.put('habits', habit);
}

export async function deleteHabitFromDB(habitId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['habits', 'habitLogs'], 'readwrite');
  await tx.objectStore('habits').delete(habitId);

  // Clean up related logs
  const logIndex = tx.objectStore('habitLogs').index('by-habit');
  let cursor = await logIndex.openCursor(habitId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ----------------- HABIT LOGS CRUD -----------------
export async function getAllHabitLogs(): Promise<HabitLog[]> {
  const db = await getDB();
  return db.getAll('habitLogs');
}

export async function saveHabitLog(log: HabitLog): Promise<void> {
  const db = await getDB();
  await db.put('habitLogs', log);
}

export async function deleteHabitLogFromDB(logId: string): Promise<void> {
  const db = await getDB();
  await db.delete('habitLogs', logId);
}

// ----------------- STARTER PACK SEEDING -----------------
export function getStarterPackData(referenceDate = new Date()) {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const todayStr = formatDate(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);
  const twoDaysAgo = new Date(referenceDate);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = formatDate(twoDaysAgo);
  const threeDaysAgo = new Date(referenceDate);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = formatDate(threeDaysAgo);

  const tags: Tag[] = [
    { id: 'tag-phy', name: 'Physics ⚡', color: '#F43F5E', createdAt: new Date().toISOString() },
    { id: 'tag-chem', name: 'Chemistry 🧪', color: '#A855F7', createdAt: new Date().toISOString() },
    { id: 'tag-bio', name: 'Biology 🧬', color: '#10B981', createdAt: new Date().toISOString() },
    { id: 'tag-practice', name: 'MCQ Practice 🎯', color: '#EC4899', createdAt: new Date().toISOString() },
    { id: 'tag-care', name: 'Self Care 🌸', color: '#F59E0B', createdAt: new Date().toISOString() },
    { id: 'tag-rev', name: 'Revision 📖', color: '#38BDF8', createdAt: new Date().toISOString() },
  ];

  const habits: Habit[] = [
    {
      id: 'habit-phy-mcq',
      title: '30 MCQs Physics Daily ⚡',
      tagIds: ['tag-phy', 'tag-practice'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      notes: 'Solve mechanics and optics numericals',
    },
    {
      id: 'habit-chem-mcq',
      title: '20 MCQs Chemistry Daily 🧪',
      tagIds: ['tag-chem', 'tag-practice'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      notes: 'Physical chem formulas & Inorganic exceptions',
    },
    {
      id: 'habit-bio-mcq',
      title: '40 MCQs Biology Daily 🧬',
      tagIds: ['tag-bio', 'tag-practice'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      notes: 'NCERT diagram-based questions & assertion reasons',
    },
    {
      id: 'habit-ncert-rev',
      title: 'NCERT Bio Line-by-Line Revision 🌸',
      tagIds: ['tag-bio', 'tag-rev'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      notes: 'Highlight keywords and summary boxes',
    },
    {
      id: 'habit-mock-exam',
      title: 'NEET Full Mock Test & Mistake Journal 🩺',
      tagIds: ['tag-practice', 'tag-rev'],
      frequency: 'weeklyDays',
      daysOfWeek: [0, 6], // Sun, Sat
      createdAt: new Date().toISOString(),
      notes: '3hr 20min strict timer test + error analysis',
    },
    {
      id: 'habit-care',
      title: 'Hydration & Mindful Deep Breathing 🍵',
      tagIds: ['tag-care'],
      frequency: 'daily',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      createdAt: new Date().toISOString(),
      notes: 'Stay calm, future doctor!',
    },
  ];

  const todoTemplates: TodoTemplate[] = [
    {
      id: 'todo-tmpl-botany',
      title: 'Botany: Cell Cycle & Division Unit Test 🌿',
      tagIds: ['tag-bio', 'tag-practice'],
      isRepeatable: false,
      createdAt: new Date().toISOString(),
      notes: 'Revise mitosis/meiosis checkpoints beforehand',
    },
    {
      id: 'todo-tmpl-organic',
      title: 'Organic Chemistry: Named Reactions Flashcards ✨',
      tagIds: ['tag-chem', 'tag-rev'],
      isRepeatable: true,
      createdAt: new Date().toISOString(),
      notes: 'Aldol, Cannizzaro, Sandmeyer, Reimer-Tiemann',
    },
    {
      id: 'todo-tmpl-physics',
      title: 'Physics Mechanics Formula & Dimensions Revision 📐',
      tagIds: ['tag-phy', 'tag-rev'],
      isRepeatable: true,
      createdAt: new Date().toISOString(),
      notes: 'Center of mass, rotational inertia and torque',
    },
    {
      id: 'todo-tmpl-pyq',
      title: 'NEET 5-Year PYQs Detailed Error Analysis 📝',
      tagIds: ['tag-practice', 'tag-rev'],
      isRepeatable: false,
      createdAt: new Date().toISOString(),
      notes: 'Track silly mistakes in calculations',
    },
  ];

  const todoInstances: TodoInstance[] = [
    {
      id: 'inst-botany-today',
      todoTemplateId: 'todo-tmpl-botany',
      date: todayStr,
      completed: true,
      completedAt: new Date().toISOString(),
    },
    {
      id: 'inst-organic-today',
      todoTemplateId: 'todo-tmpl-organic',
      date: todayStr,
      completed: false,
    },
    {
      id: 'inst-physics-yesterday',
      todoTemplateId: 'todo-tmpl-physics',
      date: yesterdayStr,
      completed: true,
      completedAt: yesterday.toISOString(),
    },
    {
      id: 'inst-pyq-twoago',
      todoTemplateId: 'todo-tmpl-pyq',
      date: twoDaysAgoStr,
      completed: true,
      completedAt: twoDaysAgo.toISOString(),
    },
  ];

  const habitLogs: HabitLog[] = [
    // Today logs
    { id: `log-phy-${todayStr}`, habitId: 'habit-phy-mcq', date: todayStr, completed: true },
    { id: `log-bio-${todayStr}`, habitId: 'habit-bio-mcq', date: todayStr, completed: true },
    { id: `log-ncert-${todayStr}`, habitId: 'habit-ncert-rev', date: todayStr, completed: true },
    { id: `log-care-${todayStr}`, habitId: 'habit-care', date: todayStr, completed: true },

    // Yesterday logs
    { id: `log-phy-${yesterdayStr}`, habitId: 'habit-phy-mcq', date: yesterdayStr, completed: true },
    { id: `log-chem-${yesterdayStr}`, habitId: 'habit-chem-mcq', date: yesterdayStr, completed: true },
    { id: `log-bio-${yesterdayStr}`, habitId: 'habit-bio-mcq', date: yesterdayStr, completed: true },
    { id: `log-ncert-${yesterdayStr}`, habitId: 'habit-ncert-rev', date: yesterdayStr, completed: true },
    { id: `log-care-${yesterdayStr}`, habitId: 'habit-care', date: yesterdayStr, completed: true },

    // 2 Days ago logs
    { id: `log-phy-${twoDaysAgoStr}`, habitId: 'habit-phy-mcq', date: twoDaysAgoStr, completed: true },
    { id: `log-chem-${twoDaysAgoStr}`, habitId: 'habit-chem-mcq', date: twoDaysAgoStr, completed: true },
    { id: `log-bio-${twoDaysAgoStr}`, habitId: 'habit-bio-mcq', date: twoDaysAgoStr, completed: true },
    { id: `log-care-${twoDaysAgoStr}`, habitId: 'habit-care', date: twoDaysAgoStr, completed: true },

    // 3 Days ago logs
    { id: `log-phy-${threeDaysAgoStr}`, habitId: 'habit-phy-mcq', date: threeDaysAgoStr, completed: true },
    { id: `log-chem-${threeDaysAgoStr}`, habitId: 'habit-chem-mcq', date: threeDaysAgoStr, completed: true },
    { id: `log-bio-${threeDaysAgoStr}`, habitId: 'habit-bio-mcq', date: threeDaysAgoStr, completed: true },
    { id: `log-ncert-${threeDaysAgoStr}`, habitId: 'habit-ncert-rev', date: threeDaysAgoStr, completed: true },
  ];

  return { tags, habits, todoTemplates, todoInstances, habitLogs };
}

export async function seedStarterPack(forceOverwrite = false): Promise<boolean> {
  const db = await getDB();
  const existingTags = await db.getAll('tags');
  const existingHabits = await db.getAll('habits');

  if (!forceOverwrite && (existingTags.length > 0 || existingHabits.length > 0)) {
    return false; // Already populated
  }

  const starter = getStarterPackData();
  const tx = db.transaction(['tags', 'habits', 'todoTemplates', 'todoInstances', 'habitLogs'], 'readwrite');

  if (forceOverwrite) {
    await tx.objectStore('tags').clear();
    await tx.objectStore('habits').clear();
    await tx.objectStore('todoTemplates').clear();
    await tx.objectStore('todoInstances').clear();
    await tx.objectStore('habitLogs').clear();
  }

  for (const tag of starter.tags) {
    await tx.objectStore('tags').put(tag);
  }
  for (const habit of starter.habits) {
    await tx.objectStore('habits').put(habit);
  }
  for (const template of starter.todoTemplates) {
    await tx.objectStore('todoTemplates').put(template);
  }
  for (const instance of starter.todoInstances) {
    await tx.objectStore('todoInstances').put(instance);
  }
  for (const log of starter.habitLogs) {
    await tx.objectStore('habitLogs').put(log);
  }

  await tx.done;
  return true;
}

export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tags', 'habits', 'todoTemplates', 'todoInstances', 'habitLogs'], 'readwrite');
  await tx.objectStore('tags').clear();
  await tx.objectStore('habits').clear();
  await tx.objectStore('todoTemplates').clear();
  await tx.objectStore('todoInstances').clear();
  await tx.objectStore('habitLogs').clear();
  await tx.done;
}
