import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';

interface TokenData {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is required');
    }

    const cookies = parse(req.headers.cookie || '');
    const storedState = cookies.oauth_state;
    const storedNonce = cookies.oauth_nonce;
    const codeVerifier = cookies.oauth_code_verifier;

    if (!validate(state as string, storedState)) {
      throw new Error('State mismatch');
    }

    const tokenData = await exchangeCodeForToken(code, codeVerifier, req.headers.origin as string);
    const decodedNonce = decodeNonce(tokenData.id_token);

    if (!validate(decodedNonce, storedNonce)) {
      throw new Error('Nonce mismatch');
    }

    await setAuthCookies(res, tokenData);

    // Clear the state, nonce, and oauth_code_verifier cookies
    const clearStateCookie = serialize('oauth_state', '', { maxAge: 0, path: '/' });
    const clearNonceCookie = serialize('oauth_nonce', '', { maxAge: 0, path: '/' });
    const clearCodeVerifierCookie = serialize('oauth_code_verifier', '', { maxAge: 0, path: '/' });

    res.setHeader('Set-Cookie', [clearStateCookie, clearNonceCookie, clearCodeVerifierCookie]);

    res.redirect('/profile');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/auth/error');
  }
}

function validate(value: string | null, storedValue: string | undefined): boolean {
  if (!value || !storedValue) {
    return false;
  }
  return value === storedValue;
}

function decodeNonce(idToken: string): string {
  const payload = idToken.split('.')[1];
  const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
  const nonceMatch = decodedPayload.match(/"nonce":"([^"]+)"/);
  return nonceMatch ? nonceMatch[1] : '';
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string | undefined,
  requestOrigin: string,
): Promise<TokenData> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID!,
    client_secret: process.env.VERCEL_APP_CLIENT_SECRET!,
    code: code,
    code_verifier: codeVerifier || '',
    redirect_uri: `${requestOrigin}/api/auth/callback`,
  });

  const response = await fetch('https://api.vercel.com/login/oauth/token', {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to exchange code for token: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

async function setAuthCookies(res: NextApiResponse, tokenData: TokenData) {
  const accessTokenCookie = serialize('access_token', tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokenData.expires_in,
    path: '/',
  });

  const refreshTokenCookie = serialize('refresh_token', tokenData.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
}