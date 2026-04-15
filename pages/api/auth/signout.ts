import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token found' });
  }

  const credentials = `${process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID}:${process.env.VERCEL_APP_CLIENT_SECRET}`;

  const response = await fetch('https://api.vercel.com/login/oauth/token/revoke', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
    },
    body: new URLSearchParams({
      token: accessToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error revoking token:', errorData);
    return res.status(response.status).json({ error: 'Failed to revoke access token' });
  }

  const clearAccessTokenCookie = serialize('access_token', '', { maxAge: 0, path: '/' });
  const clearRefreshTokenCookie = serialize('refresh_token', '', { maxAge: 0, path: '/' });

  res.setHeader('Set-Cookie', [clearAccessTokenCookie, clearRefreshTokenCookie]);

  res.status(response.status).json({});
}