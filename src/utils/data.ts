import type { AppData, Task, TimeByStage } from '../types';
import { TASK_TITLES, MAX_PROGRESS } from '../types';

export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function createEmptyTimeByStage(): TimeByStage {
  return [0, 0, 0, 0, 0, 0];
}

export function createInitialTasks(): Task[] {
  return TASK_TITLES.map((title, index) => ({
    id: index + 1,
    title,
    progress: 0,
    timeByStage: createEmptyTimeByStage(),
  }));
}

export function createInitialData(): AppData {
  return {
    tasks: createInitialTasks(),
    todaySteps: 0,
    lastActiveDate: todayString(),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeProgress(value: unknown): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(MAX_PROGRESS, Math.max(0, num));
}

function sanitizeTimeByStage(value: unknown): TimeByStage {
  const result = createEmptyTimeByStage();
  if (!Array.isArray(value)) return result;
  for (let i = 0; i < 6; i++) {
    const v = value[i];
    result[i] = typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
  }
  return result;
}

/**
 * localStorageから読み込んだ生データを検証し、壊れている・古い形式（作業時間情報なし）
 * であっても安全に初期値で補いながらAppDataを組み立てる。
 */
export function sanitizeAppData(raw: unknown): AppData {
  const fallback = createInitialData();
  if (typeof raw !== 'object' || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const rawTasks = Array.isArray(obj.tasks) ? obj.tasks : [];
  const tasks: Task[] = TASK_TITLES.map((title, index) => {
    const id = index + 1;
    const found = rawTasks.find(
      (t): t is Record<string, unknown> =>
        typeof t === 'object' && t !== null && (t as Record<string, unknown>).id === id
    );
    return {
      id,
      title,
      progress: found ? sanitizeProgress(found.progress) : 0,
      timeByStage: found ? sanitizeTimeByStage(found.timeByStage) : createEmptyTimeByStage(),
    };
  });

  const rawLastActiveDate =
    typeof obj.lastActiveDate === 'string' ? obj.lastActiveDate : fallback.lastActiveDate;
  const isSameDay = rawLastActiveDate === todayString();
  const todaySteps =
    isSameDay && typeof obj.todaySteps === 'number' && Number.isFinite(obj.todaySteps)
      ? Math.max(0, Math.round(obj.todaySteps))
      : 0;

  const updatedAt =
    typeof obj.updatedAt === 'string' && !Number.isNaN(Date.parse(obj.updatedAt))
      ? obj.updatedAt
      : new Date().toISOString();

  return {
    tasks,
    todaySteps,
    lastActiveDate: todayString(),
    updatedAt,
  };
}

/** 日付が変わっていた場合に「今日の前進」を0へリセットする */
export function ensureToday(data: AppData): AppData {
  const today = todayString();
  if (data.lastActiveDate === today) return data;
  return { ...data, todaySteps: 0, lastActiveDate: today };
}
