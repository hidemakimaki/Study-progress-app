type SegmentedBarProps = {
  segmentCount: number;
  filledCount: number;
  label: string;
  onSegmentClick?: (targetValue: number) => void;
};

/**
 * ブロックを横に並べた進捗バー。onSegmentClickを渡すと各区切りをクリックして
 * その段階へ直接変更できる操作可能なバーになり、渡さない場合は表示専用になる。
 */
function SegmentedBar({ segmentCount, filledCount, label, onSegmentClick }: SegmentedBarProps) {
  const segments = Array.from({ length: segmentCount }, (_, index) => index < filledCount);

  if (onSegmentClick) {
    return (
      <div className="segmented-bar" role="group" aria-label={label}>
        {segments.map((filled, index) => (
          <button
            key={index}
            type="button"
            className={`segment segment-button ${filled ? 'filled' : ''}`}
            aria-pressed={filled}
            aria-label={`段階${index + 1}にする`}
            onClick={() => onSegmentClick(index + 1)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="segmented-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={segmentCount}
      aria-valuenow={filledCount}
    >
      {segments.map((filled, index) => (
        <span key={index} className={`segment ${filled ? 'filled' : ''}`} aria-hidden="true" />
      ))}
    </div>
  );
}

export default SegmentedBar;
