import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AdminPayload {
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function generateAdminToken(): string {
  return jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AdminPayload;
    return decoded && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKeyHeader = req.headers['x-admin-key'];
  if (typeof adminKeyHeader === 'string' && adminKeyHeader === config.adminSecretKey) {
    req.admin = { role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();

    // Direct admin secret key match
    if (token === config.adminSecretKey) {
      req.admin = { role: 'admin' };
      return next();
    }

    // JWT verification
    if (verifyAdminToken(token)) {
      req.admin = { role: 'admin' };
      return next();
    }
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized: Missing or invalid authentication credentials',
  });
}
