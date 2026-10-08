import { Request, Response, NextFunction } from 'express';
import { NewContactInput } from '../db/database';

declare global {
  namespace Express {
    interface Request {
      validatedContact?: NewContactInput;
      isSpamBot?: boolean;
    }
  }
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateContactSubmission(req: Request, res: Response, next: NextFunction): void {
  const body = req.body || {};

  // Check Honeypot fields
  const honeypot = body.honeypot || body.hp_website || body.bot_field || body._gotcha;
  if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
    // Flag as spam bot and return mock success without saving to DB
    req.isSpamBot = true;
    res.status(200).json({
      success: true,
      message: 'Thank you for contacting ViezAI. We have received your request.',
    });
    return;
  }

  // Extract fields (supporting camelCase and snake_case)
  const fullName = (body.fullName || body.full_name || body.name || '').toString().trim();
  const email = (body.email || body.workEmail || body.work_email || '').toString().trim();
  const company = (body.company || body.companyName || body.company_name || '').toString().trim();
  const need = (body.need || body.useCase || body.use_case || body.service || '').toString().trim();
  const message = (body.message || body.comments || '').toString().trim();
  const teamSize = (body.teamSize || body.team_size || '').toString().trim();
  const deploymentMode = (body.deploymentMode || body.deployment_mode || '').toString().trim();

  // Validate required fields
  if (!fullName || fullName.length < 2) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Full name is required (minimum 2 characters).',
      field: 'fullName',
    });
    return;
  }

  if (fullName.length > 100) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Full name exceeds maximum length of 100 characters.',
      field: 'fullName',
    });
    return;
  }

  if (!email) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Email address is required.',
      field: 'email',
    });
    return;
  }

  if (!EMAIL_REGEX.test(email) || email.length > 120) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Please provide a valid email address.',
      field: 'email',
    });
    return;
  }

  if (company.length > 120) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Company name cannot exceed 120 characters.',
      field: 'company',
    });
    return;
  }

  if (message.length > 5000) {
    res.status(400).json({
      success: false,
      error: 'Validation failed: Message cannot exceed 5000 characters.',
      field: 'message',
    });
    return;
  }

  // Extract client metadata
  const ipAddress = (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';

  req.validatedContact = {
    fullName,
    email,
    company,
    need,
    message,
    teamSize,
    deploymentMode,
    ipAddress,
    userAgent,
  };

  next();
}
