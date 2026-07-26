import type { TabLabels } from '../types';
import { DEFAULT_TAB_LABELS } from '../types';
import StepSettings from './StepSettings';

const FIELD_LABELS = ['Task1', 'Task2', 'Task3'];

type SettingsPanelProps = {
  labels: TabLabels;
  onChange: (labels: TabLabels) => void;
  task1Titles: string[];
  onTask1TitlesChange: (titles: string[]) => void;
  task2Titles: string[];
  onTask2TitlesChange: (titles: string[]) => void;
  task3Titles: string[];
  onTask3TitlesChange: (titles: string[]) => void;
};

function SettingsPanel({
  labels,
  onChange,
  task1Titles,
  onTask1TitlesChange,
  task2Titles,
  onTask2TitlesChange,
  task3Titles,
  onTask3TitlesChange,
}: SettingsPanelProps) {
  const handleLabelChange = (index: number, value: string) => {
    const next = [...labels] as TabLabels;
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="settings-page">
      <section className="settings-panel">
        <h2 className="settings-title">タブの名前を編集</h2>
        <p className="settings-description">
          Task1〜Task3タブの表示名を変更できます。空欄のままにするとデフォルトの名前が使われます。
        </p>
        {labels.map((label, index) => (
          <div className="settings-field" key={index}>
            <label htmlFor={`tab-label-${index}`}>{FIELD_LABELS[index]}の名前</label>
            <input
              id={`tab-label-${index}`}
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(index, e.target.value)}
              placeholder={DEFAULT_TAB_LABELS[index]}
            />
          </div>
        ))}
      </section>

      <section className="settings-panel">
        <h2 className="settings-title">ステップ設定</h2>
        <p className="settings-description">
          Task1〜Task3それぞれ、ステップ数（2〜6）と各ステップの題名を自由に設定できます。ステップの中身はどれも同じ5段階の自己評価です。ステップ数を減らすと、はみ出したステップの進捗・作業時間は失われます。
        </p>
        <StepSettings boardLabel="Task1" titles={task1Titles} onChange={onTask1TitlesChange} />
        <StepSettings boardLabel="Task2" titles={task2Titles} onChange={onTask2TitlesChange} />
        <StepSettings boardLabel="Task3" titles={task3Titles} onChange={onTask3TitlesChange} />
      </section>
    </div>
  );
}

export default SettingsPanel;
