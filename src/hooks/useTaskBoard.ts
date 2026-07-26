import { useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { createInitialData, ensureToday, sanitizeAppData } from '../utils/data';
import type { AppData } from '../types';
import { MAX_PROGRESS } from '../types';

export type TaskBoard = {
  data: AppData;
  setData: (value: AppData | ((prev: AppData) => AppData)) => void;
  stats: {
    totalTasks: number;
    completedCount: number;
    overallPercent: number;
    totalMinutes: number;
  };
  handleAdvance: (taskId: number) => boolean;
  handleRetreat: (taskId: number) => void;
  handleSetProgress: (taskId: number, stage: number) => boolean;
  handleAddTime: (taskId: number, minutes: number) => void;
  handleResetAll: () => void;
};

/**
 * タスクボード（5段階の自己評価＋作業時間記録）の状態と操作をまとめたフック。
 * Task1（固定タイトル）・Task2/Task3（設定で変更可能なタイトル）で共通利用する。
 * titlesが変わった場合（ステップ数・題名の編集）は既存の進捗・作業時間をidで
 * 突き合わせながら再構成する。
 */
export function useTaskBoard(storageKey: string, titles: readonly string[]): TaskBoard {
  const [data, setData] = useLocalStorage<AppData>(storageKey, createInitialData(titles), (raw) =>
    sanitizeAppData(raw, titles)
  );

  useEffect(() => {
    // titlesが変わるたびにタスク一覧をtitlesへ揃える。内容が実際には変わっていない場合
    // （titlesの参照だけが変わった等）はupdatedAtを更新しない。無条件に更新すると、
    // 同期の取り込み直後にも再びpushが走ってしまうため。
    setData((prev) => {
      const reconciled = sanitizeAppData(prev, titles);
      const unchanged = JSON.stringify(reconciled.tasks) === JSON.stringify(prev.tasks);
      return unchanged ? prev : { ...reconciled, updatedAt: new Date().toISOString() };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titles]);

  function persist(next: AppData) {
    setData({ ...next, updatedAt: new Date().toISOString() });
  }

  const stats = useMemo(() => {
    const totalTasks = data.tasks.length;
    const completedCount = data.tasks.filter((t) => t.progress >= MAX_PROGRESS).length;
    const progressSum = data.tasks.reduce((sum, t) => sum + t.progress, 0);
    const overallPercent =
      totalTasks === 0 ? 0 : Math.round((progressSum / (totalTasks * MAX_PROGRESS)) * 100);
    const totalMinutes = data.tasks.reduce(
      (sum, t) => sum + t.timeByStage.reduce((s, m) => s + m, 0),
      0
    );
    return { totalTasks, completedCount, overallPercent, totalMinutes };
  }, [data.tasks]);

  function setTaskProgress(taskId: number, targetProgress: number): boolean {
    const cur = ensureToday(data);
    const task = cur.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const clamped = Math.min(MAX_PROGRESS, Math.max(0, targetProgress));
    if (clamped === task.progress) {
      persist(cur);
      return false;
    }

    const delta = clamped - task.progress;
    const tasks = cur.tasks.map((t) => (t.id === taskId ? { ...t, progress: clamped } : t));
    const todaySteps = delta > 0 ? cur.todaySteps + delta : cur.todaySteps;
    persist({ ...cur, tasks, todaySteps });

    return delta > 0 && clamped === MAX_PROGRESS;
  }

  function handleAdvance(taskId: number): boolean {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return false;
    return setTaskProgress(taskId, task.progress + 1);
  }

  function handleRetreat(taskId: number) {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTaskProgress(taskId, task.progress - 1);
  }

  function handleSetProgress(taskId: number, stage: number): boolean {
    return setTaskProgress(taskId, stage);
  }

  function handleAddTime(taskId: number, minutes: number) {
    const cur = ensureToday(data);
    const task = cur.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const timeByStage = [...task.timeByStage] as typeof task.timeByStage;
    timeByStage[task.progress] += minutes;
    const tasks = cur.tasks.map((t) => (t.id === taskId ? { ...t, timeByStage } : t));
    persist({ ...cur, tasks });
  }

  function handleResetAll() {
    const confirmed = window.confirm('すべての進捗と作業時間をリセットします。よろしいですか？');
    if (!confirmed) return;
    persist(createInitialData(titles));
  }

  return { data, setData, stats, handleAdvance, handleRetreat, handleSetProgress, handleAddTime, handleResetAll };
}
