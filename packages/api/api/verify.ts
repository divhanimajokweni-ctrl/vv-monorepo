import { keystore } from '../lib/keystore';
import * as ed from '@noble/ed25519';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, signature, signerPubKey } = req.body;

    if (!payload || !signature || !signerPubKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const payloadStr = JSON.stringify(payload);
    const signatureBytes = Buffer.from(signature, 'hex');

    const isValid = await ed.verify(signatureBytes, payloadStr, signerPubKey);

    res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}</content>
<parameter name="filePath">packages/api/api/verify.ts