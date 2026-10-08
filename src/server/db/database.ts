import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  company: string;
  need: string;
  message: string;
  status: 'new' | 'contacting' | 'completed' | 'archived';
  notes: string;
  ip_address: string;
  user_agent: string;
  team_size: string;
  deployment_mode: string;
  created_at: string;
  updated_at: string;
}

export interface NewContactInput {
  fullName: string;
  email: string;
  company?: string;
  need?: string;
  message?: string;
  teamSize?: string;
  deploymentMode?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ContactFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContactStats {
  total: number;
  new: number;
  contacting: number;
  completed: number;
  archived: number;
  responseRate: number; // percentage (contacting + completed) / total * 100
}

export class DatabaseService {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  public async init(): Promise<void> {
    if (this.db) return;

    this.SQL = await initSqlJs();

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
      this.saveToDisk();
    }

    this.createSchema();
  }

  private createSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        need TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        notes TEXT DEFAULT '',
        ip_address TEXT,
        user_agent TEXT,
        team_size TEXT,
        deployment_mode TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
      CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    `);
    this.saveToDisk();
  }

  private saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public insertContact(input: NewContactInput): Contact {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const id = uuidv4();
    const contact: Contact = {
      id,
      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      company: (input.company || '').trim(),
      need: (input.need || '').trim(),
      message: (input.message || '').trim(),
      status: 'new',
      notes: '',
      ip_address: input.ipAddress || '',
      user_agent: input.userAgent || '',
      team_size: input.teamSize || '',
      deployment_mode: input.deploymentMode || '',
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        id, full_name, email, company, need, message,
        status, notes, ip_address, user_agent, team_size,
        deployment_mode, created_at, updated_at
      ) VALUES (
        $id, $full_name, $email, $company, $need, $message,
        $status, $notes, $ip_address, $user_agent, $team_size,
        $deployment_mode, $created_at, $updated_at
      )
    `);

    stmt.run({
      $id: contact.id,
      $full_name: contact.full_name,
      $email: contact.email,
      $company: contact.company,
      $need: contact.need,
      $message: contact.message,
      $status: contact.status,
      $notes: contact.notes,
      $ip_address: contact.ip_address,
      $user_agent: contact.user_agent,
      $team_size: contact.team_size,
      $deployment_mode: contact.deployment_mode,
      $created_at: contact.created_at,
      $updated_at: contact.updated_at,
    });
    stmt.free();

    this.saveToDisk();
    return contact;
  }

  public getContacts(filter: ContactFilter = {}): {
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    if (!this.db) throw new Error('Database not initialized');

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (filter.status && filter.status !== 'all') {
      conditions.push('status = $status');
      params['$status'] = filter.status;
    }

    if (filter.search && filter.search.trim()) {
      conditions.push('(full_name LIKE $search OR email LIKE $search OR company LIKE $search OR need LIKE $search OR message LIKE $search)');
      params['$search'] = `%${filter.search.trim()}%`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) as count FROM contacts ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    countStmt.bind(params);
    countStmt.step();
    const countObj = countStmt.getAsObject();
    const total = Number(countObj.count || 0);
    countStmt.free();

    // Fetch paginated results
    const selectSql = `
      SELECT * FROM contacts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $limit OFFSET $offset
    `;
    const selectParams = {
      ...params,
      $limit: limit,
      $offset: offset,
    };

    const stmt = this.db.prepare(selectSql);
    stmt.bind(selectParams);

    const contacts: Contact[] = [];
    while (stmt.step()) {
      contacts.push(stmt.getAsObject() as unknown as Contact);
    }
    stmt.free();

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      contacts,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getContactById(id: string): Contact | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = $id LIMIT 1');
    stmt.bind({ $id: id });
    let contact: Contact | null = null;
    if (stmt.step()) {
      contact = stmt.getAsObject() as unknown as Contact;
    }
    stmt.free();
    return contact;
  }

  public updateContact(
    id: string,
    updates: { status?: 'new' | 'contacting' | 'completed' | 'archived'; notes?: string }
  ): Contact | null {
    if (!this.db) throw new Error('Database not initialized');

    const existing = this.getContactById(id);
    if (!existing) return null;

    const newStatus = updates.status !== undefined ? updates.status : existing.status;
    const newNotes = updates.notes !== undefined ? updates.notes : existing.notes;
    const updatedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE contacts
      SET status = $status, notes = $notes, updated_at = $updated_at
      WHERE id = $id
    `);
    stmt.run({
      $id: id,
      $status: newStatus,
      $notes: newNotes,
      $updated_at: updatedAt,
    });
    stmt.free();

    this.saveToDisk();
    return this.getContactById(id);
  }

  public deleteContact(id: string): boolean {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = $id');
    stmt.run({ $id: id });
    stmt.free();

    this.saveToDisk();
    return true;
  }

  public getStats(): ContactStats {
    if (!this.db) throw new Error('Database not initialized');

    const res = this.db.exec(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'contacting' THEN 1 ELSE 0 END) as contacting_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count
      FROM contacts;
    `);

    if (!res || res.length === 0 || !res[0].values || res[0].values.length === 0) {
      return { total: 0, new: 0, contacting: 0, completed: 0, archived: 0, responseRate: 0 };
    }

    const row = res[0].values[0];
    const total = Number(row[0] || 0);
    const newCount = Number(row[1] || 0);
    const contactingCount = Number(row[2] || 0);
    const completedCount = Number(row[3] || 0);
    const archivedCount = Number(row[4] || 0);

    const responded = contactingCount + completedCount;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return {
      total,
      new: newCount,
      contacting: contactingCount,
      completed: completedCount,
      archived: archivedCount,
      responseRate,
    };
  }

  public getAllForExport(): Contact[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM contacts ORDER BY created_at DESC');
    const contacts: Contact[] = [];
    while (stmt.step()) {
      contacts.push(stmt.getAsObject() as unknown as Contact);
    }
    stmt.free();
    return contacts;
  }

  public close(): void {
    if (this.db) {
      this.saveToDisk();
      this.db.close();
      this.db = null;
    }
  }
}
