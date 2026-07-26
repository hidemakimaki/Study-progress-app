import { GIST_FILENAME } from '../types';

const API_BASE = 'https://api.github.com';

export class GistSyncError extends Error {}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function assertOk(response: Response, action: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 401) {
    throw new GistSyncError('トークンが無効です。gist権限を持つトークンか確認してください');
  }
  throw new GistSyncError(`${action}に失敗しました（${response.status}）`);
}

/** このトークンが所有するGistの中から、進捗データ用ファイルを含むものを探す */
export async function findExistingGist(token: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/gists`, { headers: authHeaders(token) });
  await assertOk(response, 'Gist一覧の取得');
  const gists: Array<{ id: string; files: Record<string, unknown> }> = await response.json();
  const found = gists.find((g) => Object.prototype.hasOwnProperty.call(g.files, GIST_FILENAME));
  return found ? found.id : null;
}

export async function createGist<T>(token: string, data: T): Promise<string> {
  const response = await fetch(`${API_BASE}/gists`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      description: 'study-progress-app 同期用データ（Task1〜3・設定・自動生成）',
      public: false,
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) },
      },
    }),
  });
  await assertOk(response, 'Gistの作成');
  const created: { id: string } = await response.json();
  return created.id;
}

export async function fetchGistData<T>(token: string, gistId: string): Promise<T | null> {
  const response = await fetch(`${API_BASE}/gists/${gistId}`, { headers: authHeaders(token) });
  if (response.status === 404) return null;
  await assertOk(response, 'Gistの取得');
  const gist: { files: Record<string, { content?: string } | undefined> } = await response.json();
  const file = gist.files[GIST_FILENAME];
  if (!file || !file.content) return null;
  try {
    return JSON.parse(file.content) as T;
  } catch {
    return null;
  }
}

export async function updateGist<T>(token: string, gistId: string, data: T): Promise<void> {
  const response = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) },
      },
    }),
  });
  await assertOk(response, 'Gistの更新');
}

export function gistUrl(gistId: string): string {
  return `https://gist.github.com/${gistId}`;
}
