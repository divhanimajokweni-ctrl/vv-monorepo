import { executeSlash } from '@vv-monorepo/safestakes';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident, idemKey } = req.body;

    if (!incident || !idemKey) {
      return res.status(400).json({ error: 'Missing incident or idemKey' });
    }

    const result = await executeSlash(incident, idemKey);

    res.status(200).json(result);
  } catch (error) {
    console.error('Execute slash error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}</content>
<parameter name="filePath">packages/api/api/execute-slash.ts