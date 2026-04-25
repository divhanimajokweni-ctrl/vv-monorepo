import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // If it's a health check or root
  if (request.method === 'GET') {
    return response.status(200).json({
      message: 'Venture Vision Ubuntu API',
      status: 'operational',
      version: '1.0.0',
      environment: 'production',
      timestamp: new Date().toISOString(),
      services: {
        cryptography: 'active',
        governance: 'operational',
        compliance: 'verified'
      }
    });
  }

  return response.status(404).json({ error: 'Not found' });
}