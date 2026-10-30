import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/connection.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as alive').get() as { alive: number };
    if (result && result.alive === 1) {
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
    console.error('Database health check error:', error);
  }

  res.status(200).json({
    status: 'ok',
    service: 'voiceforge-ai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
});

export default router;
