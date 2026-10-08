export type LeadStatus = 'new' | 'contacting' | 'completed' | 'archived';

export interface Contact {
  id: string;
  full_name: string;
  email: string;
  company: string;
  need: string;
  message: string;
  status: LeadStatus;
  notes: string;
  ip_address: string;
  user_agent: string;
  team_size: string;
  deployment_mode: string;
  created_at: string;
  updated_at: string;
}

export interface ContactStats {
  total: number;
  new: number;
  contacting: number;
  completed: number;
  archived: number;
  responseRate: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
