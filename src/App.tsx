import { useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGistSync } from './hooks/useGistSync';
import { useTaskBoard } from './hooks/useTaskBoard';
import {
  sanitizeTabKey,
  sanitizeTabLabels,
  sanitizeStepTitles,
  defaultStepTitles,
  normalizeSyncBundle,
} from './utils/data';
import type { SyncBundle, TabKey, TabLabels } from './types';
import {
  ACTIVE_TAB_KEY,
  DEFAULT_TAB_LABELS,
  SETTINGS_UPDATED_AT_KEY,
  STORAGE_KEY,
  TAB_LABELS_KEY,
  TASK1_STEPS_KEY,
  TASK2_STORAGE_KEY,
  TASK3_STORAGE_KEY,
  TASK2_STEPS_KEY,
  TASK3_STEPS_KEY,
  TASK_TITLES,
} from './types';
import BoardView from './components/BoardView';
import SyncSettings from './components/SyncSettings';
import TabNav from './components/TabNav';
import SettingsPanel from './components/SettingsPanel';
import './styles.css';

const EPOCH = new Date(0).toISOString();

function latestOf(timestamps: string[]): string {
  return timestamps.reduce((latest, t) => (Date.parse(t) > Date.parse(latest) ? t : latest));
}

function App() {
  const [tabLabels, setTabLabels] = useLocalStorage<TabLabels>(
    TAB_LABELS_KEY,
    DEFAULT_TAB_LABELS,
    sanitizeTabLabels
  );
  const [activeTab, setActiveTab] = useLocalStorage<TabKey>(
    ACTIVE_TAB_KEY,
    'task1',
    sanitizeTabKey
  );
  const [task1Titles, setTask1Titles] = useLocalStorage<string[]>(
    TASK1_STEPS_KEY,
    [...TASK_TITLES],
    (raw) => sanitizeStepTitles(raw, [...TASK_TITLES])
  );
  const [task2Titles, setTask2Titles] = useLocalStorage<string[]>(
    TASK2_STEPS_KEY,
    defaultStepTitles(),
    (raw) => sanitizeStepTitles(raw)
  );
  const [task3Titles, setTask3Titles] = useLocalStorage<string[]>(
    TASK3_STEPS_KEY,
    defaultStepTitles(),
    (raw) => sanitizeStepTitles(raw)
  );
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useLocalStorage<string>(
    SETTINGS_UPDATED_AT_KEY,
    EPOCH
  );

  const board1 = useTaskBoard(STORAGE_KEY, task1Titles);
  const board2 = useTaskBoard(TASK2_STORAGE_KEY, task2Titles);
  const board3 = useTaskBoard(TASK3_STORAGE_KEY, task3Titles);

  /** タブ名・ステップ設定を変更する際は、同期用のupdatedAtも一緒に打刻する */
  function touchSettings() {
    setSettingsUpdatedAt(new Date().toISOString());
  }
  function updateTabLabels(next: TabLabels) {
    setTabLabels(next);
    touchSettings();
  }
  function updateTask1Titles(next: string[]) {
    setTask1Titles(next);
    touchSettings();
  }
  function updateTask2Titles(next: string[]) {
    setTask2Titles(next);
    touchSettings();
  }
  function updateTask3Titles(next: string[]) {
    setTask3Titles(next);
    touchSettings();
  }

  const bundleUpdatedAt = useMemo(
    () =>
      latestOf([
        settingsUpdatedAt,
        board1.data.updatedAt,
        board2.data.updatedAt,
        board3.data.updatedAt,
      ]),
    [settingsUpdatedAt, board1.data.updatedAt, board2.data.updatedAt, board3.data.updatedAt]
  );

  const syncBundle = useMemo<SyncBundle>(
    () => ({
      tabLabels,
      task1Titles,
      task2Titles,
      task3Titles,
      task1Data: board1.data,
      task2Data: board2.data,
      task3Data: board3.data,
      settingsUpdatedAt,
      updatedAt: bundleUpdatedAt,
    }),
    [
      tabLabels,
      task1Titles,
      task2Titles,
      task3Titles,
      board1.data,
      board2.data,
      board3.data,
      settingsUpdatedAt,
      bundleUpdatedAt,
    ]
  );

  function applyRemoteBundle(remote: SyncBundle) {
    const normalized = normalizeSyncBundle(remote);
    setTabLabels(normalized.tabLabels);
    setTask1Titles(normalized.task1Titles);
    setTask2Titles(normalized.task2Titles);
    setTask3Titles(normalized.task3Titles);
    setSettingsUpdatedAt(normalized.settingsUpdatedAt);
    board1.setData(normalized.task1Data);
    board2.setData(normalized.task2Data);
    board3.setData(normalized.task3Data);
  }

  const sync = useGistSync<SyncBundle>({ data: syncBundle, onRemoteData: applyRemoteBundle });

  return (
    <div className="app">
      <TabNav labels={tabLabels} activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === 'task1' && (
        <BoardView
          heading={tabLabels[0].trim() || DEFAULT_TAB_LABELS[0]}
          stats={board1.stats}
          todaySteps={board1.data.todaySteps}
          tasks={board1.data.tasks}
          onAdvance={board1.handleAdvance}
          onRetreat={board1.handleRetreat}
          onSetProgress={board1.handleSetProgress}
          onAddTime={board1.handleAddTime}
          onResetAll={board1.handleResetAll}
        />
      )}

      {activeTab === 'task2' && (
        <BoardView
          heading={tabLabels[1].trim() || DEFAULT_TAB_LABELS[1]}
          stats={board2.stats}
          todaySteps={board2.data.todaySteps}
          tasks={board2.data.tasks}
          onAdvance={board2.handleAdvance}
          onRetreat={board2.handleRetreat}
          onSetProgress={board2.handleSetProgress}
          onAddTime={board2.handleAddTime}
          onResetAll={board2.handleResetAll}
        />
      )}

      {activeTab === 'task3' && (
        <BoardView
          heading={tabLabels[2].trim() || DEFAULT_TAB_LABELS[2]}
          stats={board3.stats}
          todaySteps={board3.data.todaySteps}
          tasks={board3.data.tasks}
          onAdvance={board3.handleAdvance}
          onRetreat={board3.handleRetreat}
          onSetProgress={board3.handleSetProgress}
          onAddTime={board3.handleAddTime}
          onResetAll={board3.handleResetAll}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsPanel
          labels={tabLabels}
          onChange={updateTabLabels}
          task1Titles={task1Titles}
          onTask1TitlesChange={updateTask1Titles}
          task2Titles={task2Titles}
          onTask2TitlesChange={updateTask2Titles}
          task3Titles={task3Titles}
          onTask3TitlesChange={updateTask3Titles}
          syncSlot={
            <SyncSettings
              status={sync.status}
              errorMessage={sync.errorMessage}
              gistId={sync.gistId}
              lastSyncedAt={sync.lastSyncedAt}
              onConnect={sync.connect}
              onDisconnect={sync.disconnect}
              onManualSync={sync.manualSync}
            />
          }
        />
      )}
    </div>
  );
}

export default App;
