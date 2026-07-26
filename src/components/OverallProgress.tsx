import SegmentedBar from './SegmentedBar';
import { formatMinutes } from '../utils/time';

type OverallProgressProps = {
  completedCount: number;
  totalTasks: number;
  overallPercent: number;
  totalMinutes: number;
  todaySteps: number;
};

const OVERALL_SEGMENTS = 10;

function OverallProgress({
  completedCount,
  totalTasks,
  overallPercent,
  totalMinutes,
  todaySteps,
}: OverallProgressProps) {
  const filledSegments = Math.round((overallPercent / 100) * OVERALL_SEGMENTS);

  return (
    <header className="overall-progress">
      <h1>
        家族心理学会 自主シンポジウム
        <br />
        スライド作成進捗
      </h1>

      <div className="overall-stats">
        <div className="stat">
          <span className="stat-value">
            {completedCount} / {totalTasks}
          </span>
          <span className="stat-label">タスク完了</span>
        </div>
        <div className="stat">
          <span className="stat-value">{overallPercent}％</span>
          <span className="stat-label">全体進捗</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatMinutes(totalMinutes)}</span>
          <span className="stat-label">総作業時間</span>
        </div>
        <div className="stat">
          <span className="stat-value">{todaySteps}ステップ</span>
          <span className="stat-label">今日の前進</span>
        </div>
      </div>

      <SegmentedBar
        segmentCount={OVERALL_SEGMENTS}
        filledCount={filledSegments}
        label={`全体進捗 ${overallPercent}パーセント`}
      />
    </header>
  );
}

export default OverallProgress;
