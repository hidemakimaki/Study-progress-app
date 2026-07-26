const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const STATE_KEY = 'githubOAuthState';

export class OAuthError extends Error {}

/** VercelでVITE_GITHUB_CLIENT_IDが設定されているビルドでのみログインボタンを出す */
export function isOAuthConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GITHUB_CLIENT_ID);
}

function redirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function redirectToGitHubLogin(): void {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', 'gist');
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('state', state);
  window.location.assign(url.toString());
}

/** URLにOAuthコールバック（code/state）が付いていれば取り出し、URLはきれいに戻す */
export function consumePendingOAuthCallback(): { code: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return null;

  const expected = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  window.history.replaceState({}, '', window.location.pathname);

  if (state !== expected) return null;
  return { code };
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch('/api/github-oauth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    throw new OAuthError('GitHubログインに失敗しました');
  }
  const data: { access_token?: string } = await response.json();
  if (!data.access_token) {
    throw new OAuthError('GitHubログインに失敗しました');
  }
  return data.access_token;
}
