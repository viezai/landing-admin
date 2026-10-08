import { Router, Request, Response } from 'express';
import { config } from '../config';
import { generateAdminToken, verifyAdminToken } from '../middleware/auth';

export function createAuthRouter(): Router {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', (req: Request, res: Response): void => {
    const { key, password } = req.body || {};
    const inputKey = (key || password || '').toString().trim();

    if (!inputKey) {
      res.status(400).json({
        success: false,
        error: 'Admin authentication key or password is required.',
      });
      return;
    }

    if (inputKey !== config.adminSecretKey) {
      res.status(401).json({
        success: false,
        error: 'Invalid admin credentials.',
      });
      return;
    }

    const token = generateAdminToken();
    res.json({
      success: true,
      token,
      role: 'admin',
      message: 'Authentication successful.',
    });
  });

  // GET /api/auth/verify
  router.get('/verify', (req: Request, res: Response): void => {
    const adminKeyHeader = req.headers['x-admin-key'];
    if (typeof adminKeyHeader === 'string' && adminKeyHeader === config.adminSecretKey) {
      res.json({ success: true, authenticated: true, role: 'admin' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token === config.adminSecretKey || verifyAdminToken(token)) {
        res.json({ success: true, authenticated: true, role: 'admin' });
        return;
      }
    }

    res.status(401).json({ success: false, authenticated: false });
  });

  return router;
}
