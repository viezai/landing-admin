import { Router, Request, Response } from 'express';
import { DatabaseService } from '../db/database';
import { validateContactSubmission } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimit';
import { sendLeadNotification } from '../services/notification';

export function createContactsRouter(db: DatabaseService): Router {
  const router = Router();
  const rateLimiter = createRateLimiter();

  // Ingestion Endpoint: POST /api/contacts
  router.post(
    '/',
    rateLimiter,
    validateContactSubmission,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const contactInput = req.validatedContact!;
        const contact = db.insertContact(contactInput);

        // Asynchronously trigger notification webhooks
        sendLeadNotification(contact).catch(err => {
          console.error('[Notification Trigger Error]:', err);
        });

        res.status(201).json({
          success: true,
          message: 'Contact request submitted successfully. Our enterprise engineering team will reach out within 2 hours.',
          data: {
            id: contact.id,
            fullName: contact.full_name,
            email: contact.email,
            company: contact.company,
            createdAt: contact.created_at,
          },
        });
      } catch (error: any) {
        console.error('[Ingest Error]:', error);
        res.status(500).json({
          success: false,
          error: 'An internal error occurred while processing the contact submission.',
        });
      }
    }
  );

  return router;
}
