/**
 * Mtaafix API client — a fully-typed wrapper around the REST backend.
 *
 * Works in the browser and in Node 18+ (uses the global `fetch`). Import it
 * from a frontend build, or compile it to JS with `npm run build:client`.
 *
 *   import { MtaafixClient } from './mtaafix-client';
 *   const api = new MtaafixClient('http://127.0.0.1:4000');
 *   const reports = await api.listReports({ category: 'roads' });
 *   const session = await api.login('admin', 'admin123');
 *   await api.admin.setStatus('MTF-2026-XXXX', ReportStatus.Assigned);
 */

// --- domain types -----------------------------------------------------------

export type CategoryId =
  | 'roads' | 'water' | 'power' | 'garbage'
  | 'lights' | 'drainage' | 'security' | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

/** Report status, matching the backend's ordered status list. */
export enum ReportStatus {
  Submitted = 0,
  UnderReview = 1,
  Assigned = 2,
  InProgress = 3,
  Resolved = 4,
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  note: string | null;
  at: string; // ISO timestamp
}

/** Public report shape (reporter contact details are masked). */
export interface Report {
  id: string;
  cat: CategoryId;
  ward: string;
  landmark: string;
  desc: string;
  name: string;        // first name only on public responses
  phone: string;       // masked on public responses
  photo: string | null;
  status: ReportStatus;
  statusLabel: string;
  created: string;
  updated: string;
  history?: StatusHistoryEntry[];
}

/** Admin report shape — same as Report but with raw, unmasked contact info. */
export type AdminReport = Report;

export interface Stats {
  total: number;
  resolved: number;
  active: number;
  categories: number;
}

export interface StatsBreakdown extends Stats {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface CreateReportInput {
  cat: CategoryId;
  ward: string;
  landmark?: string;
  desc: string;
  name: string;
  phone: string;
  /** Optional photo as a base64 data URL, or pass a File via `createReportForm`. */
  photo?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export interface Session {
  token: string;
  expires: string;
  user: AdminUser;
}

export interface ReportQuery {
  category?: CategoryId;
  status?: ReportStatus;
}

export interface AdminReportQuery extends ReportQuery {
  q?: string; // free-text search
}

/** Thrown when the API returns a non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// --- client -----------------------------------------------------------------

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class MtaafixClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private token: string | null = null;

  /** Authenticated management endpoints. */
  readonly admin: AdminApi;

  constructor(baseUrl = '', fetchImpl?: FetchLike) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    const f = fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
    if (!f) throw new Error('No fetch implementation available; pass one to the constructor.');
    this.fetchImpl = f.bind(globalThis);
    this.admin = new AdminApi(this);
  }

  /** Set/clear the session token used for admin requests. */
  setToken(token: string | null): void {
    this.token = token;
  }
  getToken(): string | null {
    return this.token;
  }

  /** Internal request helper. Throws {@link ApiError} on failure. */
  async request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
    const headers = new Headers(init.headers);
    if (auth) {
      if (!this.token) throw new ApiError('Not authenticated', 401);
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    const res = await this.fetchImpl(this.baseUrl + path, { ...init, headers });
    const text = await res.text();
    const data: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const body = data as { error?: string; errors?: string[] } | null;
      const msg = body?.errors?.join(', ') ?? body?.error ?? `Request failed (${res.status})`;
      throw new ApiError(msg, res.status, data);
    }
    return data as T;
  }

  private query(params: Record<string, string | number | undefined>): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
  }

  // --- public endpoints -----------------------------------------------------

  getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  getStatuses(): Promise<string[]> {
    return this.request<string[]>('/api/statuses');
  }

  getStats(): Promise<Stats> {
    return this.request<Stats>('/api/stats');
  }

  listReports(query: ReportQuery = {}): Promise<Report[]> {
    return this.request<Report[]>('/api/reports' + this.query({ category: query.category, status: query.status }));
  }

  getReport(id: string): Promise<Report> {
    return this.request<Report>('/api/reports/' + encodeURIComponent(id));
  }

  /** Create a report from a plain object (photo optional, as a base64 data URL). */
  createReport(input: CreateReportInput): Promise<Report> {
    return this.request<Report>('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  /** Create a report using multipart/form-data — use this to upload a File. */
  createReportForm(input: Omit<CreateReportInput, 'photo'>, photo?: Blob): Promise<Report> {
    const fd = new FormData();
    fd.append('cat', input.cat);
    fd.append('ward', input.ward);
    if (input.landmark) fd.append('landmark', input.landmark);
    fd.append('desc', input.desc);
    fd.append('name', input.name);
    fd.append('phone', input.phone);
    if (photo) fd.append('photo', photo);
    return this.request<Report>('/api/reports', { method: 'POST', body: fd });
  }

  // --- auth -----------------------------------------------------------------

  /** Log in as an admin. On success the token is stored on this client. */
  async login(username: string, password: string): Promise<Session> {
    const session = await this.request<Session>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    this.token = session.token;
    return session;
  }

  async logout(): Promise<void> {
    if (!this.token) return;
    await this.request<{ ok: true }>('/api/admin/logout', { method: 'POST' }, true);
    this.token = null;
  }
}

/** Authenticated management API. Accessed via `client.admin`. */
export class AdminApi {
  constructor(private readonly c: MtaafixClient) {}

  me(): Promise<{ user: AdminUser }> {
    return this.c.request<{ user: AdminUser }>('/api/admin/me', {}, true);
  }

  listReports(query: AdminReportQuery = {}): Promise<AdminReport[]> {
    const q = new URLSearchParams();
    if (query.category) q.set('category', query.category);
    if (query.status !== undefined) q.set('status', String(query.status));
    if (query.q) q.set('q', query.q);
    const s = q.toString();
    return this.c.request<AdminReport[]>('/api/admin/reports' + (s ? `?${s}` : ''), {}, true);
  }

  getReport(id: string): Promise<AdminReport> {
    return this.c.request<AdminReport>('/api/admin/reports/' + encodeURIComponent(id), {}, true);
  }

  setStatus(id: string, status: ReportStatus, note?: string): Promise<AdminReport> {
    return this.c.request<AdminReport>('/api/admin/reports/' + encodeURIComponent(id) + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    }, true);
  }

  deleteReport(id: string): Promise<{ ok: true }> {
    return this.c.request<{ ok: true }>('/api/admin/reports/' + encodeURIComponent(id), { method: 'DELETE' }, true);
  }

  stats(): Promise<StatsBreakdown> {
    return this.c.request<StatsBreakdown>('/api/admin/stats', {}, true);
  }
}