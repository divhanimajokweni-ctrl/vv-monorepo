import { keystore } from '../lib/keystore';
import * as ed from '@noble/ed25519';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, keyId } = req.body;

    if (!payload || !keyId) {
      return res.status(400).json({ error: 'Missing payload or keyId' });
    }

    const key = keystore.getKey(keyId);
    if (!key) {
      return res.status(400).json({ error: 'Unknown key' });
    }

    if (keystore.isExpired(key)) {
      return res.status(400).json({ error: 'Key has expired' });
    }

    const signature = await ed.sign(JSON.stringify(payload), key.privateKey);
    const signatureHex = Buffer.from(signature).toString('hex');

    res.status(200).json({ signature: signatureHex });
  } catch (error) {
    console.error('Sign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}</content>
<parameter name="filePath">packages/api/api/sign.ts