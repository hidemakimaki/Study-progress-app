import type { ChangeEvent } from 'react';
import { MIN_STEPS, MAX_STEPS } from '../types';

type StepSettingsProps = {
  boardLabel: string;
  titles: string[];
  onChange: (titles: string[]) => void;
};

const STEP_COUNT_OPTIONS = Array.from(
  { length: MAX_STEPS - MIN_STEPS + 1 },
  (_, i) => MIN_STEPS + i
);

/** Task2/Task3のステップ数（2〜6）と各ステップの題名を編集するフォーム。 */
function StepSettings({ boardLabel, titles, onChange }: StepSettingsProps) {
  const handleCountChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const count = Number(e.target.value);
    const next = Array.from({ length: count }, (_, i) => titles[i] ?? `ステップ${i + 1}`);
    onChange(next);
  };

  const handleTitleChange = (index: number, value: string) => {
    const next = [...titles];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="step-settings">
      <h3 className="step-settings-title">{boardLabel}のステップ設定</h3>

      <div className="settings-field">
        <label htmlFor={`${boardLabel}-step-count`}>ステップ数</label>
        <select
          id={`${boardLabel}-step-count`}
          value={titles.length}
          onChange={handleCountChange}
        >
          {STEP_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {titles.map((title, index) => (
        <div className="settings-field" key={index}>
          <label htmlFor={`${boardLabel}-step-title-${index}`}>ステップ{index + 1}の題名</label>
          <input
            id={`${boardLabel}-step-title-${index}`}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(index, e.target.value)}
            placeholder={`ステップ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

export default StepSettings;
