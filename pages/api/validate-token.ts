import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

interface IntrospectionResponse {
  active: boolean;
  aud?: string;
  client_id?: string;
  token_type?: 'bearer';
  exp?: number;
  iat?: number;
  sub?: string;
  iss?: string;
  jti?: string;
  session_id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: 'No access token found' });
    }

    const introspectResponse = await fetch('https://api.vercel.com/login/oauth/token/introspect', {
      method: 'POST',
      body: new URLSearchParams({ token }),
    });

    if (!introspectResponse.ok) {
      return res.status(500).json({ error: 'Failed to introspect token' });
    }

    const introspectionData: IntrospectionResponse = await introspectResponse.json();

    if (!introspectionData.active) {
      return res.status(401).json({ error: 'Token is not active' });
    }

    res.status(200).json({
      message: 'Token is valid!',
      tokenInfo: introspectionData,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}