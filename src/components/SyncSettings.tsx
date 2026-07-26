import { useState } from 'react';
import type { SyncStatus } from '../hooks/useGistSync';
import { gistUrl } from '../sync/githubGist';
import { isOAuthConfigured, redirectToGitHubLogin } from '../auth/githubOAuth';

type SyncSettingsProps = {
  status: SyncStatus;
  errorMessage: string | null;
  gistId: string | null;
  lastSyncedAt: string | null;
  onConnect: (token: string) => void;
  onDisconnect: () => void;
  onManualSync: () => void;
};

const STATUS_LABELS: Record<SyncStatus, string> = {
  disabled: '未接続（この端末のみ）',
  idle: '待機中',
  syncing: '同期中…',
  synced: '同期済み',
  error: 'エラー',
};

function formatSyncedAt(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function SyncSettings({
  status,
  errorMessage,
  gistId,
  lastSyncedAt,
  onConnect,
  onDisconnect,
  onManualSync,
}: SyncSettingsProps) {
  const [open, setOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const oauthAvailable = isOAuthConfigured();
  const [showManualToken, setShowManualToken] = useState(!oauthAvailable);
  const isConnected = status !== 'disabled';

  const handleConnect = () => {
    if (!tokenInput.trim()) return;
    onConnect(tokenInput.trim());
    setTokenInput('');
  };

  return (
    <section className="sync-settings">
      <button
        type="button"
        className="sync-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        他の端末と同期{isConnected ? `（${STATUS_LABELS[status]}）` : ''}
      </button>

      {open && (
        <div className="sync-panel">
          {!isConnected ? (
            <>
              <p className="sync-description">
                進捗データをGitHub Gistに保存し、他の端末（スマホなど）でも同じ進捗を見られるようにします。
              </p>

              {oauthAvailable && (
                <button
                  type="button"
                  className="btn btn-primary sync-login-btn"
                  onClick={redirectToGitHubLogin}
                >
                  GitHubでログイン
                </button>
              )}

              {oauthAvailable && !showManualToken ? (
                <button
                  type="button"
                  className="sync-manual-toggle"
                  onClick={() => setShowManualToken(true)}
                >
                  または、トークンを直接入力（詳細）
                </button>
              ) : (
                <>
                  <p className="sync-description">
                    トークンは
                    <a
                      href="https://github.com/settings/tokens/new?scopes=gist&description=study-progress-app"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHubのトークン発行ページ
                    </a>
                    で「gist」権限のみを選んで発行してください。トークンはこの端末のブラウザ内にのみ保存されます。
                  </p>
                  <div className="sync-form">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_..."
                      aria-label="GitHub個人アクセストークン"
                    />
                    <button type="button" className="btn btn-outline" onClick={handleConnect}>
                      接続
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="sync-status-line">
                状態：{STATUS_LABELS[status]}
                {lastSyncedAt && status !== 'syncing' && `（最終同期 ${formatSyncedAt(lastSyncedAt)}）`}
              </p>
              {gistId && (
                <p className="sync-gist-link">
                  <a href={gistUrl(gistId)} target="_blank" rel="noreferrer">
                    同期用Gistを開く
                  </a>
                </p>
              )}
              <div className="sync-form">
                <button type="button" className="btn btn-outline" onClick={onManualSync}>
                  今すぐ同期
                </button>
                <button type="button" className="btn btn-outline" onClick={onDisconnect}>
                  同期を解除
                </button>
              </div>
            </>
          )}
          {errorMessage && (
            <p className="error-message" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default SyncSettings;
