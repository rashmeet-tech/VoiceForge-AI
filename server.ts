import { createApp } from './app.js';
import { config } from './config/index.js';
import { initializeDatabase, closeDatabase } from './db/index.js';

async function bootstrap() {
  try {
    // 1. Initialize SQLite database & schema
    initializeDatabase();
    console.log('[Database] SQLite initialized successfully');

    // 2. Create Express app
    const app = createApp();

    // 3. Start server
    const server = app.listen(config.port, () => {
      console.log(`[Server] VoiceForge AI backend running on http://localhost:${config.port}`);
      console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        closeDatabase();
        console.log('[Database] SQLite connection closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Bootstrap] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
