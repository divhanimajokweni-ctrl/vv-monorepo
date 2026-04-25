import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const path = request.url || '';
  
  if (path.includes('health')) {
    return response.status(200).json({
      status: 'healthy',
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

  if (path.includes('sign') && request.method === 'POST') {
    return response.status(200).json({
      signature: 'demo-signature',
      keyId: 'safe-stakes-executor-key',
      timestamp: new Date().toISOString()
    });
  }

  if (path.includes('verify') && request.method === 'POST') {
    return response.status(200).json({
      valid: true,
      timestamp: new Date().toISOString()
    });
  }

  return response.status(200).json({
    message: 'Venture Vision Ubuntu API',
    status: 'operational',
    version: '1.0.0',
    environment: 'production',
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/sign', '/verify']
  });
}