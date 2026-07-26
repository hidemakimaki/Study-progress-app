import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AppData } from '../types';
import { GIST_TOKEN_KEY, GIST_ID_KEY } from '../types';
import {
  createGist,
  fetchGistData,
  findExistingGist,
  updateGist,
  GistSyncError,
} from '../sync/githubGist';

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'synced' | 'error';

type UseGistSyncOptions = {
  data: AppData;
  onRemoteData: (data: AppData) => void;
};

type UseGistSyncResult = {
  status: SyncStatus;
  errorMessage: string | null;
  gistId: string | null;
  lastSyncedAt: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  manualSync: () => void;
};

const DEBOUNCE_MS = 1500;

/**
 * 進捗データ(AppData)をGitHub Gistへミラーし、端末間で同期する。
 * 競合はupdatedAtによるlast-write-winsで解決する（このアプリは1人で複数端末から
 * 使う前提のため、厳密なマージ機能は持たない）。
 */
export function useGistSync({ data, onRemoteData }: UseGistSyncOptions): UseGistSyncResult {
  const [token, setToken] = useLocalStorage<string>(GIST_TOKEN_KEY, '');
  const [gistId, setGistId] = useLocalStorage<string>(GIST_ID_KEY, '');
  const [status, setStatus] = useState<SyncStatus>(token && gistId ? 'idle' : 'disabled');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const skipNextPush = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const push = async (t: string, id: string) => {
    setStatus('syncing');
    try {
      await updateGist(t, id, dataRef.current);
      setStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof GistSyncError ? err.message : 'Gistへの保存に失敗しました');
    }
  };

  const pull = async (t: string, id: string) => {
    setStatus('syncing');
    try {
      const remote = await fetchGistData(t, id);
      const remoteNewer =
        !!remote && Date.parse(remote.updatedAt) > Date.parse(dataRef.current.updatedAt);
      if (remote && remoteNewer) {
        skipNextPush.current = true;
        onRemoteData(remote);
      } else {
        await updateGist(t, id, dataRef.current);
      }
      setStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof GistSyncError ? err.message : 'Gistとの同期に失敗しました');
    }
  };

  // 起動時、既にトークン・gistIdが保存されていれば一度同期する
  useEffect(() => {
    if (token && gistId) {
      pull(token, gistId);
    }
  }, []);

  // データが変わるたびデバウンスしてpushする（リモート由来の更新は除外しループを防ぐ）
  useEffect(() => {
    if (!token || !gistId) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      push(token, gistId);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [data, token, gistId]);

  const connect = async (newToken: string) => {
    setErrorMessage(null);
    setStatus('syncing');
    try {
      let id = await findExistingGist(newToken);
      if (!id) {
        id = await createGist(newToken, dataRef.current);
      }
      setToken(newToken);
      setGistId(id);
      await pull(newToken, id);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof GistSyncError ? err.message : '接続に失敗しました');
    }
  };

  const disconnect = () => {
    setToken('');
    setGistId('');
    setStatus('disabled');
    setErrorMessage(null);
    setLastSyncedAt(null);
  };

  const manualSync = () => {
    if (token && gistId) pull(token, gistId);
  };

  return {
    status,
    errorMessage,
    gistId: gistId || null,
    lastSyncedAt,
    connect,
    disconnect,
    manualSync,
  };
}
