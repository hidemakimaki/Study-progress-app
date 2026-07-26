import type { AppData, SyncBundle, Task, TabKey, TabLabels, TimeByStage } from '../types';
import { TASK_TITLES, MAX_PROGRESS, DEFAULT_TAB_LABELS, MIN_STEPS, MAX_STEPS, DEFAULT_STEP_COUNT } from '../types';

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

export function createInitialTasks(titles: readonly string[] = TASK_TITLES): Task[] {
  return titles.map((title, index) => ({
    id: index + 1,
    title,
    progress: 0,
    timeByStage: createEmptyTimeByStage(),
  }));
}

export function createInitialData(titles: readonly string[] = TASK_TITLES): AppData {
  return {
    tasks: createInitialTasks(titles),
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
 * や、titlesの数・内容が変わった場合（Task2/Task3のステップ設定変更）であっても、
 * 既存の進捗・作業時間をidで突き合わせながら安全にAppDataを組み立てる。
 */
export function sanitizeAppData(raw: unknown, titles: readonly string[] = TASK_TITLES): AppData {
  const fallback = createInitialData(titles);
  if (typeof raw !== 'object' || raw === null) return fallback;
  const obj = raw as Record<string, unknown>;

  const rawTasks = Array.isArray(obj.tasks) ? obj.tasks : [];
  const tasks: Task[] = titles.map((title, index) => {
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

export function sanitizeTabLabels(raw: unknown): TabLabels {
  if (!Array.isArray(raw) || raw.length !== 3) return DEFAULT_TAB_LABELS;
  return raw.map((v, i) => (typeof v === 'string' ? v : DEFAULT_TAB_LABELS[i])) as TabLabels;
}

const VALID_TAB_KEYS: TabKey[] = ['task1', 'task2', 'task3', 'settings'];

export function sanitizeTabKey(raw: unknown): TabKey {
  return typeof raw === 'string' && VALID_TAB_KEYS.includes(raw as TabKey)
    ? (raw as TabKey)
    : 'task1';
}

export function defaultStepTitles(count: number = DEFAULT_STEP_COUNT): string[] {
  return Array.from({ length: count }, (_, i) => `ステップ${i + 1}`);
}

export function sanitizeStepTitles(raw: unknown, fallback: string[] = defaultStepTitles()): string[] {
  if (!Array.isArray(raw) || raw.length < MIN_STEPS || raw.length > MAX_STEPS) {
    return fallback;
  }
  return raw.map((v, i) => (typeof v === 'string' ? v : (fallback[i] ?? `ステップ${i + 1}`)));
}

/**
 * Gistから取得した生データをSyncBundleへ組み立てる。Task1のみを同期していた
 * 旧バージョン（tasks配列を直接持つAppData形式）で保存されたGistも検知して
 * 自動的に移行する。
 */
export function normalizeSyncBundle(raw: unknown): SyncBundle {
  const nowIso = new Date().toISOString();

  if (typeof raw !== 'object' || raw === null) {
    return {
      tabLabels: DEFAULT_TAB_LABELS,
      task1Titles: [...TASK_TITLES],
      task2Titles: defaultStepTitles(),
      task3Titles: defaultStepTitles(),
      task1Data: createInitialData(TASK_TITLES),
      task2Data: createInitialData(defaultStepTitles()),
      task3Data: createInitialData(defaultStepTitles()),
      settingsUpdatedAt: nowIso,
      updatedAt: nowIso,
    };
  }

  const obj = raw as Record<string, unknown>;

  // 旧バージョン（Task1のみ同期・tasks配列を直接持つ形式）からの移行
  if (Array.isArray(obj.tasks)) {
    const legacyData = sanitizeAppData(obj, TASK_TITLES);
    return {
      tabLabels: DEFAULT_TAB_LABELS,
      task1Titles: [...TASK_TITLES],
      task2Titles: defaultStepTitles(),
      task3Titles: defaultStepTitles(),
      task1Data: legacyData,
      task2Data: createInitialData(defaultStepTitles()),
      task3Data: createInitialData(defaultStepTitles()),
      settingsUpdatedAt: legacyData.updatedAt,
      updatedAt: legacyData.updatedAt,
    };
  }

  const task1Titles = sanitizeStepTitles(obj.task1Titles, [...TASK_TITLES]);
  const task2Titles = sanitizeStepTitles(obj.task2Titles);
  const task3Titles = sanitizeStepTitles(obj.task3Titles);

  const updatedAt =
    typeof obj.updatedAt === 'string' && !Number.isNaN(Date.parse(obj.updatedAt))
      ? obj.updatedAt
      : nowIso;

  return {
    tabLabels: sanitizeTabLabels(obj.tabLabels),
    task1Titles,
    task2Titles,
    task3Titles,
    task1Data: sanitizeAppData(obj.task1Data, task1Titles),
    task2Data: sanitizeAppData(obj.task2Data, task2Titles),
    task3Data: sanitizeAppData(obj.task3Data, task3Titles),
    settingsUpdatedAt: typeof obj.settingsUpdatedAt === 'string' ? obj.settingsUpdatedAt : updatedAt,
    updatedAt,
  };
}
