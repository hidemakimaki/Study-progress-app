import { useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGistSync } from './hooks/useGistSync';
import { createInitialData, ensureToday, sanitizeAppData } from './utils/data';
import type { AppData } from './types';
import { MAX_PROGRESS, STORAGE_KEY } from './types';
import OverallProgress from './components/OverallProgress';
import TaskCard from './components/TaskCard';
import SyncSettings from './components/SyncSettings';
import './styles.css';

function App() {
  const [data, setData] = useLocalStorage<AppData>(
    STORAGE_KEY,
    createInitialData(),
    sanitizeAppData
  );

  /** updatedAtを必ず打刻してから保存する（端末間の同期でどちらが新しいか判定するため） */
  function persist(next: AppData) {
    setData({ ...next, updatedAt: new Date().toISOString() });
  }

  const sync = useGistSync({ data, onRemoteData: setData });

  const stats = useMemo(() => {
    const totalTasks = data.tasks.length;
    const completedCount = data.tasks.filter((t) => t.progress >= MAX_PROGRESS).length;
    const progressSum = data.tasks.reduce((sum, t) => sum + t.progress, 0);
    const overallPercent = Math.round((progressSum / (totalTasks * MAX_PROGRESS)) * 100);
    const totalMinutes = data.tasks.reduce(
      (sum, t) => sum + t.timeByStage.reduce((s, m) => s + m, 0),
      0
    );
    return { totalTasks, completedCount, overallPercent, totalMinutes };
  }, [data.tasks]);

  /** 進捗をtargetProgressへ変更する。完成（5）へ新たに到達した場合はtrueを返す。 */
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
    persist(createInitialData());
  }

  return (
    <div className="app">
      <OverallProgress
        completedCount={stats.completedCount}
        totalTasks={stats.totalTasks}
        overallPercent={stats.overallPercent}
        totalMinutes={stats.totalMinutes}
        todaySteps={data.todaySteps}
      />

      <main className="task-list">
        {data.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onAdvance={handleAdvance}
            onRetreat={handleRetreat}
            onSetProgress={handleSetProgress}
            onAddTime={handleAddTime}
          />
        ))}
      </main>

      <SyncSettings
        status={sync.status}
        errorMessage={sync.errorMessage}
        gistId={sync.gistId}
        lastSyncedAt={sync.lastSyncedAt}
        onConnect={sync.connect}
        onDisconnect={sync.disconnect}
        onManualSync={sync.manualSync}
      />

      <footer className="app-footer">
        <button type="button" className="btn btn-reset" onClick={handleResetAll}>
          すべての進捗をリセット
        </button>
      </footer>
    </div>
  );
}

export default App;
