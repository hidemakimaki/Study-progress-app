import type { ReactNode } from 'react';
import type { Task } from '../types';
import OverallProgress from './OverallProgress';
import TaskCard from './TaskCard';
import RandomQuote from './RandomQuote';

type BoardViewProps = {
  heading: ReactNode;
  stats: {
    totalTasks: number;
    completedCount: number;
    overallPercent: number;
    totalMinutes: number;
  };
  todaySteps: number;
  tasks: Task[];
  onAdvance: (taskId: number) => boolean;
  onRetreat: (taskId: number) => void;
  onSetProgress: (taskId: number, stage: number) => boolean;
  onAddTime: (taskId: number, minutes: number) => void;
  onResetAll: () => void;
};

/** タスクボード（全体進捗＋タスクカード一覧）の共通表示。Task1/Task2/Task3で共用する。 */
function BoardView({
  heading,
  stats,
  todaySteps,
  tasks,
  onAdvance,
  onRetreat,
  onSetProgress,
  onAddTime,
  onResetAll,
}: BoardViewProps) {
  return (
    <>
      <OverallProgress
        heading={heading}
        completedCount={stats.completedCount}
        totalTasks={stats.totalTasks}
        overallPercent={stats.overallPercent}
        totalMinutes={stats.totalMinutes}
        todaySteps={todaySteps}
      />

      <main className="task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onAdvance={onAdvance}
            onRetreat={onRetreat}
            onSetProgress={onSetProgress}
            onAddTime={onAddTime}
          />
        ))}
      </main>

      <footer className="app-footer">
        <RandomQuote />
        <button type="button" className="btn btn-reset" onClick={onResetAll}>
          すべての進捗をリセット
        </button>
      </footer>
    </>
  );
}

export default BoardView;
