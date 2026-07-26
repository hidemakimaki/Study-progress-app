export type TimeByStage = [number, number, number, number, number, number];

export type Task = {
  id: number;
  title: string;
  progress: number; // 0〜5
  timeByStage: TimeByStage; // 各段階の累計作業時間（分）
};

export type AppData = {
  tasks: Task[];
  todaySteps: number;
  lastActiveDate: string; // YYYY-MM-DD形式
  updatedAt: string; // ISO文字列。端末間の同期でどちらが新しいか判定するために使う
};

export const STAGE_LABELS = [
  '未着手',
  '少し着手',
  '材料を整理中',
  '内容を作成中',
  'ほぼ完成',
  '完成',
] as const;

export const TASK_TITLES = [
  'リフレクティング式事例検討会についてスライドにまとめる',
  'これまでのリフレクティングの理論と課題についてまとめる',
  'ケースカンファレンスの理論の課題についてまとめる',
  'スーパーヴィジョンの理論と課題についてまとめる',
  '全体を推敲する',
] as const;

// ステップごとのメインカラー（識別用）。1・2は青系、3はアクア、4・5は赤系でグルーピング。
export const TASK_COLORS: Record<number, { base: string; dark: string; bg: string }> = {
  1: { base: '#2a78d6', dark: '#1b4d8a', bg: '#dde9f8' }, // blue（明るい青）
  2: { base: '#1e4d8f', dark: '#0e2443', bg: '#dbe3ed' }, // navy（濃い青）
  3: { base: '#1baf7a', dark: '#0f5f43', bg: '#dbf2ea' }, // aqua（変更なし）
  4: { base: '#d9482a', dark: '#8e2d19', bg: '#f9e2dd' }, // red-orange（明るい赤）
  5: { base: '#b3261e', dark: '#641511', bg: '#f3dcdb' }, // deep red（濃い赤）
  6: { base: '#4a3aa7', dark: '#332872', bg: '#e2dff1' }, // violet（Task2/3で6ステップ目に使用）
};

export const MAX_PROGRESS = 5;
export const STORAGE_KEY = 'slideProgressData';
export const GIST_FILENAME = 'slide-progress-data.json';
export const GIST_TOKEN_KEY = 'githubSyncToken';
export const GIST_ID_KEY = 'githubSyncGistId';

// ---------- タブ ----------

export type TabKey = 'task1' | 'task2' | 'task3' | 'settings';

export type TabLabels = [string, string, string];

export const DEFAULT_TAB_LABELS: TabLabels = ['家族心理学会 自主シンポジウム', 'Task2', 'Task3'];

export const TAB_LABELS_KEY = 'tabLabels';
export const ACTIVE_TAB_KEY = 'activeTab';

// ---------- Task1・Task2・Task3のステップ設定 ----------

export const MIN_STEPS = 2;
export const MAX_STEPS = 6;
export const DEFAULT_STEP_COUNT = 2;

export const TASK1_STEPS_KEY = 'task1StepTitles';
export const TASK2_STORAGE_KEY = 'task2Data';
export const TASK3_STORAGE_KEY = 'task3Data';
export const TASK2_STEPS_KEY = 'task2StepTitles';
export const TASK3_STEPS_KEY = 'task3StepTitles';

// ---------- 同期（Task1〜Task3・設定をまとめて1つのGistに保存） ----------

export type SyncBundle = {
  tabLabels: TabLabels;
  task1Titles: string[];
  task2Titles: string[];
  task3Titles: string[];
  task1Data: AppData;
  task2Data: AppData;
  task3Data: AppData;
  settingsUpdatedAt: string;
  updatedAt: string; // Task1〜3・設定のうち最新の更新日時
};

export const SETTINGS_UPDATED_AT_KEY = 'settingsUpdatedAt';
