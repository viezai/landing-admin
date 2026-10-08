import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../server/db/database';
import { createApp } from '../server/app';
import { config } from '../server/config';

describe('ViezAI Landing Admin & Ingestion API Test Suite', () => {
  let db: DatabaseService;
  let app: any;
  const testDbPath = path.resolve(process.cwd(), 'data/test-contacts.db');
  let adminToken = '';
  let createdContactId = '';

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new DatabaseService(testDbPath);
    await db.init();
    app = createApp(db);
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Health and Ingestion API (AC-1)', () => {
    it('GET /health returns status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/contacts successfully ingests valid lead', async () => {
      const payload = {
        fullName: 'Kakashi Hatake',
        email: 'kakashi@shinobi.leaf',
        company: 'Konoha Tech',
        need: 'autonomous-coding',
        message: 'Need 100 autonomous AI agents for shadow mission.',
        teamSize: '51-200',
        deploymentMode: 'private-vpc',
      };

      const res = await request(app)
        .post('/api/contacts')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('kakashi@shinobi.leaf');

      createdContactId = res.body.data.id;
    });

    it('POST /api/contacts supports snake_case parameters', async () => {
      const payload = {
        full_name: 'Shikamaru Nara',
        work_email: 'shikamaru@leaf.gov',
        company_name: 'Strategic Advisory LLC',
        use_case: 'multi-agent-planning',
        message: 'What a drag, automate my backlog.',
      };

      const res = await request(app)
        .post('/api/contacts')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('shikamaru@leaf.gov');
    });

    it('POST /api/contacts fails on invalid email', async () => {
      const payload = {
        fullName: 'Naruto Uzumaki',
        email: 'invalid-email-string',
        message: 'Believe it!',
      };

      const res = await request(app)
        .post('/api/contacts')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.field).toBe('email');
    });

    it('POST /api/contacts fails on missing fullName', async () => {
      const payload = {
        fullName: ' ',
        email: 'naruto@ramen.leaf',
        message: 'Ramen delivery.',
      };

      const res = await request(app)
        .post('/api/contacts')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.field).toBe('fullName');
    });
  });

  describe('Security & Anti-Spam (AC-2)', () => {
    it('Honeypot trap drops bot submission without saving to DB', async () => {
      const initialCount = db.getContacts().total;

      const botPayload = {
        fullName: 'Spam Bot 3000',
        email: 'spammer@botnet.ru',
        honeypot: 'http://buy-viagra-cheap.xyz', // Bot filled honeypot!
        message: 'Cheap crypto loans now!',
      };

      const res = await request(app)
        .post('/api/contacts')
        .send(botPayload);

      // Returns simulated 200 to trick bot
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify NOT saved into database
      const countAfter = db.getContacts().total;
      expect(countAfter).toBe(initialCount);
    });

    it('Admin endpoint rejects unauthorized requests', async () => {
      const res = await request(app).get('/api/admin/contacts');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Admin endpoint rejects wrong secret key', async () => {
      const res = await request(app)
        .get('/api/admin/contacts')
        .set('x-admin-key', 'wrong_secret_123');
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login authenticates with admin secret key', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ key: config.adminSecretKey });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      adminToken = res.body.token;
    });

    it('Admin endpoint accepts Bearer JWT token', async () => {
      const res = await request(app)
        .get('/api/admin/contacts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Admin endpoint accepts x-admin-key header directly', async () => {
      const res = await request(app)
        .get('/api/admin/contacts')
        .set('x-admin-key', config.adminSecretKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Lead Management & Administration (AC-3)', () => {
    it('Admin can view contact details by ID', async () => {
      const res = await request(app)
        .get(`/api/admin/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdContactId);
      expect(res.body.data.full_name).toBe('Kakashi Hatake');
      expect(res.body.data.status).toBe('new');
    });

    it('Admin can update contact status and add notes', async () => {
      const res = await request(app)
        .patch(`/api/admin/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'contacting',
          notes: 'Met via encrypted video call. Scheduled POC demo for next Tuesday.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('contacting');
      expect(res.body.data.notes).toContain('Scheduled POC demo');
    });

    it('Admin can search and filter contacts', async () => {
      const res = await request(app)
        .get('/api/admin/contacts')
        .query({ search: 'Shikamaru', status: 'all' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].full_name).toBe('Shikamaru Nara');
    });

    it('Admin KPI stats returns accurate metrics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const stats = res.body.data;
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.contacting).toBeGreaterThanOrEqual(1);
      expect(stats.responseRate).toBeGreaterThan(0);
    });

    it('Admin can export all contacts as CSV', async () => {
      const res = await request(app)
        .get('/api/admin/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Full Name');
      expect(res.text).toContain('Kakashi Hatake');
      expect(res.text).toContain('Shikamaru Nara');
    });

    it('Admin can delete a contact', async () => {
      const res = await request(app)
        .delete(`/api/admin/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it no longer exists
      const verifyRes = await request(app)
        .get(`/api/admin/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe('Rate Limiter Behavior', () => {
    it('Blocks requests exceeding the rate limit per window', async () => {
      const agent = request(app);
      const testEmail = 'flooder@load.test';

      let blocked = false;
      for (let i = 0; i < 7; i++) {
        const res = await agent.post('/api/contacts').send({
          fullName: `Spam User ${i}`,
          email: `${i}_${testEmail}`,
          message: 'Load testing rate limit.',
        });

        if (res.status === 429) {
          blocked = true;
          expect(res.body.success).toBe(false);
          expect(res.body.error).toContain('Too many requests');
          break;
        }
      }

      expect(blocked).toBe(true);
    });
  });
});
