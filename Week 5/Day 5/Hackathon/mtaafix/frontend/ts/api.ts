// Typed Mtaafix API client (TypeScript source of truth).
// Compile to browser JS with:  tsc --outDir ../js ts/api.ts ts/types.ts
// The bundled js/api.js is a hand-maintained ES5 build of this module.

import type {
  Area, Category, CreateReportInput, Report, ResidentUser, RulerUser,
  Session, SmsNotification, Stats,
} from './types';

type Kind = 'resident' | 'ruler';

const BASE = ''; // same origin

function tokenKey(kind: Kind): string { return `mtaafix.${kind}.token`; }
function getToken(kind: Kind): string | null {
  try { return localStorage.getItem(tokenKey(kind)); } catch { return null; }
}
function setToken(kind: Kind, t: string | null): void {
  try { t ? localStorage.setItem(tokenKey(kind), t) : localStorage.removeItem(tokenKey(kind)); } catch { /* ignore */ }
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message); this.status = status; this.data = data;
  }
}

async function request<T>(method: string, path: string, body?: unknown, kind?: Kind): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = kind ? getToken(kind) : null;
  if (tok) headers['Authorization'] = `Bearer ${tok}`;

  const init: RequestInit = { method, headers };
  if (body !== undefined && body !== null) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, init);

  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : null;

  if (!res.ok) {
    const msg = (data && (data.error || (data.errors && data.errors.join(', ')))) || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

function qs(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.keys(params).forEach((k) => { const v = params[k]; if (v) q.set(k, v); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const MtaafixApi = {
  // reference data
  categories: () => request<Category[]>('GET', '/api/categories'),
  statuses: () => request<string[]>('GET', '/api/statuses'),
  areas: () => request<Area[]>('GET', '/api/areas'),
  stats: () => request<Stats>('GET', '/api/stats'),

  // resident session
  residentToken: () => getToken('resident'),
  async residentLogin(phone: string, name?: string, area?: string): Promise<Session<ResidentUser>> {
    const s = await request<Session<ResidentUser>>('POST', '/api/residents/login', { phone, name, area });
    setToken('resident', s.token);
    return s;
  },
  async residentLogout(): Promise<void> {
    await request('POST', '/api/residents/logout', {}, 'resident').catch(() => undefined);
    setToken('resident', null);
  },
  residentMe: () => request<{ user: ResidentUser }>('GET', '/api/residents/me', null, 'resident'),
  notifications: () => request<SmsNotification[]>('GET', '/api/residents/notifications', null, 'resident'),
  confirmNotification: (id: number) =>
    request<{ ok: boolean }>('POST', `/api/residents/notifications/${id}/confirm`, {}, 'resident'),

  // reports: residents can read + rate, never post
  reports: (params?: Record<string, string | undefined>) =>
    request<Report[]>('GET', `/api/reports${qs(params)}`, null, 'resident'),
  report: (id: string) => request<Report>('GET', `/api/reports/${id}`, null, 'resident'),
  rate: (id: string, stars: number) =>
    request<{ rating: { avg: number; count: number; mine: number } }>(
      'POST', `/api/reports/${id}/rate`, { stars }, 'resident'),

  // ruler session + posting (the only way to create reports)
  rulerToken: () => getToken('ruler'),
  async rulerLogin(username: string, password: string): Promise<Session<RulerUser>> {
    const s = await request<Session<RulerUser>>('POST', '/api/ruler/login', { username, password });
    setToken('ruler', s.token);
    return s;
  },
  async rulerLogout(): Promise<void> {
    await request('POST', '/api/ruler/logout', {}, 'ruler').catch(() => undefined);
    setToken('ruler', null);
  },
  rulerMe: () => request<{ user: RulerUser }>('GET', '/api/ruler/me', null, 'ruler'),
  postReport: (payload: CreateReportInput) =>
    request<Report>('POST', '/api/ruler/reports', payload, 'ruler'),
  rulerReports: (params?: Record<string, string | undefined>) =>
    request<Report[]>('GET', `/api/ruler/reports${qs(params)}`, null, 'ruler'),
  setStatus: (id: string, status: number, note?: string) =>
    request<Report>('PATCH', `/api/ruler/reports/${id}/status`, { status, note }, 'ruler'),
  deleteReport: (id: string) => request<{ ok: boolean }>('DELETE', `/api/ruler/reports/${id}`, null, 'ruler'),
  listRulers: () => request<RulerUser[]>('GET', '/api/ruler/rulers', null, 'ruler'),
  createRuler: (payload: { username: string; password: string; name: string; role: string; area?: string }) =>
    request<RulerUser>('POST', '/api/ruler/rulers', payload, 'ruler'),
};

export default MtaafixApi;