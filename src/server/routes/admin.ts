import { Router, Request, Response } from 'express';
import { DatabaseService } from '../db/database';
import { requireAdminAuth } from '../middleware/auth';

export function createAdminRouter(db: DatabaseService): Router {
  const router = Router();

  // All admin routes require admin authentication
  router.use(requireAdminAuth);

  // GET /api/admin/stats
  router.get('/stats', (req: Request, res: Response): void => {
    try {
      const stats = db.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      console.error('[Admin Stats Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve stats.' });
    }
  });

  // GET /api/admin/contacts
  router.get('/contacts', (req: Request, res: Response): void => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = db.getContacts({ status, search, page, limit });
      res.json({
        success: true,
        data: result.contacts,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      console.error('[Admin Get Contacts Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve contacts.' });
    }
  });

  // GET /api/admin/contacts/:id
  router.get('/contacts/:id', (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const contact = db.getContactById(id);
      if (!contact) {
        res.status(404).json({ success: false, error: 'Contact not found.' });
        return;
      }
      res.json({ success: true, data: contact });
    } catch (err: any) {
      console.error('[Admin Get Contact Detail Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve contact details.' });
    }
  });

  // PATCH /api/admin/contacts/:id
  router.patch('/contacts/:id', (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const { status, notes } = req.body || {};
      const validStatuses = ['new', 'contacting', 'completed', 'archived'];

      if (status !== undefined && !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const updated = db.updateContact(id, { status, notes });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Contact not found.' });
        return;
      }

      res.json({
        success: true,
        message: 'Contact updated successfully.',
        data: updated,
      });
    } catch (err: any) {
      console.error('[Admin Update Contact Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to update contact.' });
    }
  });

  // DELETE /api/admin/contacts/:id
  router.delete('/contacts/:id', (req: Request, res: Response): void => {
    try {
      const id = String(req.params.id);
      const existing = db.getContactById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Contact not found.' });
        return;
      }

      db.deleteContact(id);
      res.json({
        success: true,
        message: 'Contact deleted successfully.',
      });
    } catch (err: any) {
      console.error('[Admin Delete Contact Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to delete contact.' });
    }
  });

  // GET /api/admin/export - CSV download
  router.get('/export', (req: Request, res: Response): void => {
    try {
      const contacts = db.getAllForExport();
      const headers = [
        'ID',
        'Full Name',
        'Email',
        'Company',
        'Need',
        'Message',
        'Status',
        'Notes',
        'Team Size',
        'Deployment Mode',
        'IP Address',
        'Created At',
        'Updated At',
      ];

      const csvRows = [headers.join(',')];

      contacts.forEach((c: any) => {
        const row = [
          escapeCsv(c.id),
          escapeCsv(c.full_name),
          escapeCsv(c.email),
          escapeCsv(c.company),
          escapeCsv(c.need),
          escapeCsv(c.message),
          escapeCsv(c.status),
          escapeCsv(c.notes),
          escapeCsv(c.team_size),
          escapeCsv(c.deployment_mode),
          escapeCsv(c.ip_address),
          escapeCsv(c.created_at),
          escapeCsv(c.updated_at),
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\r\n');
      const filename = `viezai-leads-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send('﻿' + csvContent); // Add UTF-8 BOM for Excel
    } catch (err: any) {
      console.error('[Admin Export Error]:', err);
      res.status(500).json({ success: false, error: 'Failed to export contacts.' });
    }
  });

  return router;
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}
