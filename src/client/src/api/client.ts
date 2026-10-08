import { Contact, ContactStats, Pagination, LeadStatus } from '../types';

const TOKEN_KEY = 'viezai_admin_token';

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async login(key: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        this.setToken(data.token);
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async verifyAuth(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/verify', {
        headers: this.getHeaders(),
      });
      const data = await res.json();
      return res.ok && data.authenticated === true;
    } catch {
      return false;
    }
  },

  async getStats(): Promise<ContactStats> {
    const res = await fetch('/api/admin/stats', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();
    return data.data;
  },

  async getContacts(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Contact[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/contacts?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load contacts');
    return res.json();
  },

  async getContact(id: string): Promise<Contact> {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load contact');
    const data = await res.json();
    return data.data;
  },

  async updateContact(
    id: string,
    updates: { status?: LeadStatus; notes?: string }
  ): Promise<Contact> {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update contact');
    const data = await res.json();
    return data.data;
  },

  async deleteContact(id: string): Promise<void> {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete contact');
  },

  async submitTestLead(payload: {
    fullName: string;
    email: string;
    company?: string;
    need?: string;
    message?: string;
    teamSize?: string;
    deploymentMode?: string;
    honeypot?: string;
  }): Promise<any> {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Submission failed');
    }
    return data;
  },

  downloadCsv(): void {
    const token = this.getToken();
    // Direct fetch with auth header to trigger browser download
    fetch('/api/admin/export', {
      headers: this.getHeaders(),
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `viezai-leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download error:', err);
        alert('Failed to download CSV');
      });
  },
};
