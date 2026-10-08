import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
}) {
  const windowMs = options?.windowMs ?? config.rateLimit.windowMs;
  const maxRequests = options?.maxRequests ?? config.rateLimit.maxRequests;
  const ipMap = new Map<string, RateLimitRecord>();

  // Periodically clean up old IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < windowMs);
      if (record.timestamps.length === 0) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );

    const now = Date.now();
    let record = ipMap.get(clientIp);

    if (!record) {
      record = { timestamps: [] };
      ipMap.set(clientIp, record);
    }

    // Retain only timestamps within the current window
    record.timestamps = record.timestamps.filter(t => now - t < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

    if (record.timestamps.length >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later in a minute.',
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}
