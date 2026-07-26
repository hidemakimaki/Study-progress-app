import { useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type TimerState = {
  runningSince: number | null; // 計測開始時刻（epoch ms）。停止中はnull
  accumulatedMs: number; // それまでに貯まった経過時間
};

const INITIAL_TIMER_STATE: TimerState = { runningSince: null, accumulatedMs: 0 };

function sanitizeTimerState(raw: unknown): TimerState {
  if (raw && typeof raw === 'object' && 'runningSince' in raw && 'accumulatedMs' in raw) {
    const r = raw as { runningSince: unknown; accumulatedMs: unknown };
    const runningSince = typeof r.runningSince === 'number' ? r.runningSince : null;
    const accumulatedMs =
      typeof r.accumulatedMs === 'number' && r.accumulatedMs >= 0 ? r.accumulatedMs : 0;
    return { runningSince, accumulatedMs };
  }
  return INITIAL_TIMER_STATE;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

type TaskTimerProps = {
  taskId: number;
  stageLabel: string;
  onRecord: (minutes: number) => void;
};

/** タスクごとの自由計測タイマー。停止中もタイムスタンプで計算するため、リロードや放置後も正確。 */
function TaskTimer({ taskId, stageLabel, onRecord }: TaskTimerProps) {
  const [timer, setTimer] = useLocalStorage<TimerState>(
    `taskTimer:${taskId}`,
    INITIAL_TIMER_STATE,
    sanitizeTimerState
  );
  const [, forceTick] = useState(0);

  const isRunning = timer.runningSince !== null;

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRunning]);

  const elapsedMs = timer.accumulatedMs + (isRunning ? Date.now() - (timer.runningSince as number) : 0);
  const canRecord = elapsedMs >= 60000;

  const handleStart = () => {
    setTimer((prev) => (prev.runningSince !== null ? prev : { ...prev, runningSince: Date.now() }));
  };

  const handlePause = () => {
    setTimer((prev) =>
      prev.runningSince === null
        ? prev
        : { runningSince: null, accumulatedMs: prev.accumulatedMs + (Date.now() - prev.runningSince) }
    );
  };

  const handleRecord = () => {
    const finalMs =
      timer.accumulatedMs + (timer.runningSince !== null ? Date.now() - timer.runningSince : 0);
    const minutes = Math.round(finalMs / 60000);
    setTimer(INITIAL_TIMER_STATE);
    if (minutes >= 1) onRecord(minutes);
  };

  const handleReset = () => {
    setTimer(INITIAL_TIMER_STATE);
  };

  return (
    <div className="task-timer">
      <p className="task-timer-label">自由計測タイマー（{stageLabel}に記録されます）</p>
      <div className="task-timer-body">
        <span className="task-timer-clock">{formatClock(elapsedMs)}</span>
        <div className="task-timer-buttons">
          {isRunning ? (
            <button type="button" className="btn btn-outline" onClick={handlePause}>
              一時停止
            </button>
          ) : (
            <button type="button" className="btn btn-outline" onClick={handleStart}>
              {timer.accumulatedMs > 0 ? '再開' : '開始'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRecord}
            disabled={!canRecord}
          >
            記録して終了
          </button>
          {elapsedMs > 0 && (
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              リセット
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskTimer;
