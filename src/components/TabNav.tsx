import type { TabKey, TabLabels } from '../types';
import { DEFAULT_TAB_LABELS } from '../types';

type TabNavProps = {
  labels: TabLabels;
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
};

const TAB_KEYS: TabKey[] = ['task1', 'task2', 'task3'];

function TabNav({ labels, activeTab, onSelect }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="タブ切り替え">
      {TAB_KEYS.map((key, index) => {
        const label = labels[index].trim() || DEFAULT_TAB_LABELS[index];
        return (
          <button
            key={key}
            type="button"
            className={`tab-nav-button ${activeTab === key ? 'active' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
            onClick={() => onSelect(key)}
          >
            {label}
          </button>
        );
      })}
      <button
        type="button"
        className={`tab-nav-button ${activeTab === 'settings' ? 'active' : ''}`}
        aria-current={activeTab === 'settings' ? 'page' : undefined}
        onClick={() => onSelect('settings')}
      >
        設定
      </button>
    </nav>
  );
}

export default TabNav;
