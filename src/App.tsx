import { useLocalStorage } from './hooks/useLocalStorage';
import { useGistSync } from './hooks/useGistSync';
import { useTaskBoard } from './hooks/useTaskBoard';
import {
  sanitizeTabKey,
  sanitizeTabLabels,
  sanitizeStepTitles,
  defaultStepTitles,
} from './utils/data';
import type { TabKey, TabLabels } from './types';
import {
  ACTIVE_TAB_KEY,
  DEFAULT_TAB_LABELS,
  STORAGE_KEY,
  TAB_LABELS_KEY,
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
  const [task2Titles, setTask2Titles] = useLocalStorage<string[]>(
    TASK2_STEPS_KEY,
    defaultStepTitles(),
    sanitizeStepTitles
  );
  const [task3Titles, setTask3Titles] = useLocalStorage<string[]>(
    TASK3_STEPS_KEY,
    defaultStepTitles(),
    sanitizeStepTitles
  );

  const board1 = useTaskBoard(STORAGE_KEY, TASK_TITLES);
  const board2 = useTaskBoard(TASK2_STORAGE_KEY, task2Titles);
  const board3 = useTaskBoard(TASK3_STORAGE_KEY, task3Titles);

  const sync = useGistSync({ data: board1.data, onRemoteData: board1.setData });

  return (
    <div className="app">
      <TabNav labels={tabLabels} activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === 'task1' && (
        <BoardView
          heading={
            <>
              家族心理学会 自主シンポジウム
              <br />
              スライド作成進捗
            </>
          }
          stats={board1.stats}
          todaySteps={board1.data.todaySteps}
          tasks={board1.data.tasks}
          onAdvance={board1.handleAdvance}
          onRetreat={board1.handleRetreat}
          onSetProgress={board1.handleSetProgress}
          onAddTime={board1.handleAddTime}
          onResetAll={board1.handleResetAll}
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
          onChange={setTabLabels}
          task2Titles={task2Titles}
          onTask2TitlesChange={setTask2Titles}
          task3Titles={task3Titles}
          onTask3TitlesChange={setTask3Titles}
        />
      )}
    </div>
  );
}

export default App;
