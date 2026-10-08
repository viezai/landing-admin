import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { DatabaseService } from './db/database';
import { createContactsRouter } from './routes/contacts';
import { createAuthRouter } from './routes/auth';
import { createAdminRouter } from './routes/admin';

export function createApp(db: DatabaseService): Express {
  const app = express();

  // Trust proxy for IP rate limiting and reverse proxies (Nginx / Cloudflare)
  app.set('trust proxy', 1);

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // If in development or CORS_ORIGINS includes '*', allow all
        if (config.nodeEnv === 'development' || config.corsOrigins.includes('*')) {
          return callback(null, true);
        }

        const isAllowed = config.corsOrigins.some(allowed => {
          if (allowed === origin) return true;
          if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(2))) return true;
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive CORS for landing page previews, while still returning origin header
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    })
  );

  // JSON Body Parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'viezai-landing-admin',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/contacts', createContactsRouter(db));
  app.use('/api/auth', createAuthRouter());
  app.use('/api/admin', createAdminRouter(db));

  // Serve Client SPA in production
  const clientDistPaths = [
    path.resolve(process.cwd(), 'dist/client'),
    path.resolve(process.cwd(), 'dist-client'),
    path.resolve(process.cwd(), 'dist'),
  ];

  for (const clientDist of clientDistPaths) {
    if (fs.existsSync(path.join(clientDist, 'index.html'))) {
      app.use(express.static(clientDist));
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        res.sendFile(path.join(clientDist, 'index.html'));
      });
      break;
    }
  }

  // 404 Handler for unhandled API routes
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'API endpoint not found' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled Server Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error occurred.',
    });
  });

  return app;
}
