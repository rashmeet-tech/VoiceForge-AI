import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import agentRoutes from './routes/agent.routes.js';
import rulebookRoutes from './routes/rulebook.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import testingRoutes from './routes/testing.routes.js';
import deployGateRoutes from './routes/deployGate.routes.js';
import elevenlabsRoutes from './routes/elevenlabs.routes.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(requestLogger);
  app.use(
    cors({
      origin: [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );
  app.use(express.json());

  // API Routes
  app.use('/api', healthRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/rulebooks', rulebookRoutes);
  app.use('/api/rules', ruleRoutes);
  app.use('/api/testing', testingRoutes);
  app.use('/api/deploy-gate', deployGateRoutes);
  app.use('/api/elevenlabs', elevenlabsRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { message: 'Route not found' },
    });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
