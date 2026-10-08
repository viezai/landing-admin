import { config } from './config';
import { DatabaseService } from './db/database';
import { createApp } from './app';

async function bootstrap() {
  console.log(`[ViezAI Admin] Initializing Database at ${config.dbPath}...`);
  const db = new DatabaseService(config.dbPath);
  await db.init();
  console.log('[ViezAI Admin] Database initialized successfully.');

  const app = createApp(db);

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 ViezAI Contact Ingest API & Admin Dashboard`);
    console.log(`📡 Server listening on http://localhost:${config.port}`);
    console.log(`🛡️  Admin Secret Key: ${config.adminSecretKey}`);
    console.log(`🔗 Ingestion Endpoint: POST http://localhost:${config.port}/api/contacts`);
    console.log(`💻 Admin Dashboard: http://localhost:${config.port}/`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  const handleExit = () => {
    console.log('\n[ViezAI Admin] Shutting down gracefully...');
    server.close(() => {
      db.close();
      console.log('[ViezAI Admin] Server closed. Database flushed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
}

bootstrap().catch(err => {
  console.error('[ViezAI Admin Fatal Startup Error]:', err);
  process.exit(1);
});
