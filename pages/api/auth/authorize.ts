import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

function generateSecureRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytes = crypto.randomBytes(length);
  return Array.from(randomBytes, (byte) => charset[byte % charset.length]).join('');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const state = generateSecureRandomString(43);
  const nonce = generateSecureRandomString(43);
  const codeVerifier = crypto.randomBytes(43).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const stateCookie = serialize('oauth_state', state, {
    maxAge: 10 * 60, // 10 minutes
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  const nonceCookie = serialize('oauth_nonce', nonce, {
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  const codeVerifierCookie = serialize('oauth_code_verifier', codeVerifier, {
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  res.setHeader('Set-Cookie', [stateCookie, nonceCookie, codeVerifierCookie]);

  const queryParams = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID!,
    redirect_uri: `${req.headers.origin}/api/auth/callback`,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_type: 'code',
    scope: 'openid email profile offline_access',
  });

  const authorizationUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`;
  res.redirect(authorizationUrl);
}