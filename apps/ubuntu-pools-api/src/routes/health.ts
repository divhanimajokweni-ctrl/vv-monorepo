import { Router } from 'express';
import { db } from '@vv/shared-kernel';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Basic health check
    const timestamp = new Date().toISOString();

    // Database health check
    await db.execute('SELECT 1');

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp,
        service: 'ubuntu-pools-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Service unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
