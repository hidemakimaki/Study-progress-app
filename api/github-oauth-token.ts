import type { VercelRequest, VercelResponse } from '@vercel/node';

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * GitHub OAuthの認可コード→アクセストークン交換だけを行う。
 * client_secretをフロントに出さないため、この処理だけはサーバー側（Vercel Functions）で行う。
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = (req.body ?? {}) as { code?: string };
  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const clientId = process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'OAuth is not configured' });
    return;
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const data = (await tokenResponse.json()) as GitHubTokenResponse;
  if (!tokenResponse.ok || !data.access_token) {
    res.status(400).json({ error: data.error_description ?? 'token exchange failed' });
    return;
  }

  res.status(200).json({ access_token: data.access_token });
}
