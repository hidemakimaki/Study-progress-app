import { useEffect, useState, type KeyboardEvent } from 'react';
import type { CSSProperties } from 'react';
import type { Task } from '../types';
import { STAGE_LABELS, MAX_PROGRESS, TASK_COLORS } from '../types';
import { formatMinutes, parseMinutesInput } from '../utils/time';
import SegmentedBar from './SegmentedBar';
import TaskTimer from './TaskTimer';

type TaskCardProps = {
  task: Task;
  onAdvance: (taskId: number) => boolean;
  onRetreat: (taskId: number) => void;
  onSetProgress: (taskId: number, stage: number) => boolean;
  onAddTime: (taskId: number, minutes: number) => void;
};

const MESSAGE_DURATION = 2600;

function TaskCard({ task, onAdvance, onRetreat, onSetProgress, onAddTime }: TaskCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeMessage, setTimeMessage] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(null), MESSAGE_DURATION);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (!timeMessage) return;
    const timer = window.setTimeout(() => setTimeMessage(null), MESSAGE_DURATION);
    return () => window.clearTimeout(timer);
  }, [timeMessage]);

  useEffect(() => {
    if (!completionMessage) return;
    const timer = window.setTimeout(() => setCompletionMessage(null), MESSAGE_DURATION);
    return () => window.clearTimeout(timer);
  }, [completionMessage]);

  const isComplete = task.progress >= MAX_PROGRESS;
  const totalMinutes = task.timeByStage.reduce((sum, m) => sum + m, 0);

  const handleAdvance = () => {
    const becameComplete = onAdvance(task.id);
    if (becameComplete) setCompletionMessage('この項目が完成しました！');
  };

  const handleRetreat = () => {
    onRetreat(task.id);
  };

  const handleSegmentClick = (stage: number) => {
    const becameComplete = onSetProgress(task.id, stage);
    if (becameComplete) setCompletionMessage('この項目が完成しました！');
  };

  const handleAddTime = () => {
    const minutes = parseMinutesInput(inputValue);
    if (minutes === null) {
      setErrorMessage('1分以上の整数を入力してください');
      return;
    }
    setErrorMessage(null);
    onAddTime(task.id, minutes);
    setTimeMessage(`段階${task.progress}に${minutes}分を追加しました`);
    setInputValue('');
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTime();
    }
  };

  const handleTimerRecord = (minutes: number) => {
    onAddTime(task.id, minutes);
    setTimeMessage(`タイマーで計測した${minutes}分を段階${task.progress}に追加しました`);
  };

  const taskColor = TASK_COLORS[task.id];
  const taskColorStyle = taskColor
    ? ({
        '--task-accent': taskColor.base,
        '--task-accent-dark': taskColor.dark,
        '--task-accent-bg': taskColor.bg,
      } as CSSProperties)
    : undefined;

  return (
    <section
      className={`task-card ${isComplete ? 'is-complete' : ''}`}
      aria-label={task.title}
      style={taskColorStyle}
    >
      <div className="task-card-header">
        <span className="task-number">タスク{task.id}</span>
        {isComplete && <span className="complete-badge">完了</span>}
      </div>

      <h2 className="task-title">{task.title}</h2>

      <div className="task-stage-row">
        <span className="task-stage-label">
          現在の段階：段階{task.progress}（{STAGE_LABELS[task.progress]}）
        </span>
      </div>

      <SegmentedBar
        segmentCount={MAX_PROGRESS}
        filledCount={task.progress}
        label={`${task.title}の進捗、5段階中${task.progress}段階`}
        onSegmentClick={handleSegmentClick}
      />

      <div className="task-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleRetreat}
          disabled={task.progress <= 0}
          aria-label={`${task.title}の進捗を1段階戻す`}
        >
          戻す
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdvance}
          disabled={isComplete}
          aria-label={`${task.title}の進捗を1段階進める`}
        >
          進める
        </button>
      </div>

      {completionMessage && (
        <p className="completion-message" role="status">
          {completionMessage}
        </p>
      )}

      <div className="time-entry-section">
        <TaskTimer
          taskId={task.id}
          stageLabel={`段階${task.progress}（${STAGE_LABELS[task.progress]}）`}
          onRecord={handleTimerRecord}
        />

        <div className="time-entry">
          <label htmlFor={`time-input-${task.id}`}>作業時間を手動で追加：</label>
          <input
            id={`time-input-${task.id}`}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="30"
            aria-label={`${task.title}の作業時間（分）を入力`}
          />
          <span className="time-entry-unit">分</span>
          <button type="button" className="btn btn-outline" onClick={handleAddTime}>
            時間を追加
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}
      {timeMessage && (
        <p className="time-message" role="status">
          {timeMessage}
        </p>
      )}

      <div className="stage-time-summary">
        <h3>段階別の作業時間</h3>
        <ul className="stage-time-grid">
          {STAGE_LABELS.map((label, index) => (
            <li
              key={index}
              className={`stage-time-item ${index === task.progress ? 'current' : ''}`}
            >
              <span className="stage-time-name">
                段階{index}：{label}
              </span>
              <span className="stage-time-value">{formatMinutes(task.timeByStage[index])}</span>
            </li>
          ))}
        </ul>
        <p className="task-total-time">このタスクの合計：{formatMinutes(totalMinutes)}</p>
      </div>
    </section>
  );
}

export default TaskCard;
