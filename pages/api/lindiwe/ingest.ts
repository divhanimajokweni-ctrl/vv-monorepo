// pages/api/lindiwe/ingest.ts
import { NextApiRequest, NextApiResponse } from 'next';
import LindiweSignalProcessor from '@ubuntu/lindiwe/pipeline';

const processor = new LindiweSignalProcessor();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signal = req.body;
    processor.ingestSignal(signal);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}