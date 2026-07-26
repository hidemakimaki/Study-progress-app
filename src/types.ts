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

export const MAX_PROGRESS = 5;
export const STORAGE_KEY = 'slideProgressData';
export const GIST_FILENAME = 'slide-progress-data.json';
export const GIST_TOKEN_KEY = 'githubSyncToken';
export const GIST_ID_KEY = 'githubSyncGistId';
