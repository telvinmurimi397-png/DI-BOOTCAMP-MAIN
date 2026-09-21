// Shared domain types for the Mtaafix frontend.
// These types describe the JSON returned by the Python backend.

export type AreaId = string;
export type CategoryId = string;

export interface Category { id: CategoryId; label: string; icon: string; }
export interface Area { id: AreaId; name: string; }

export interface RatingSummary { avg: number; count: number; mine?: number | null; }

export interface Report {
  id: string;
  cat: CategoryId;
  area: AreaId;
  areaName: string;
  ward: string;
  landmark: string;
  desc: string;
  author: string;
  authorId: number;
  photo: string | null;
  status: number;         // 0..4
  statusLabel: string;
  created: string;        // ISO 8601
  updated: string;
  rating: RatingSummary;
  history?: { status: number; note: string | null; at: string }[];
  smsSent?: number;       // present on the ruler create response
}

export interface ResidentUser {
  id: number; phone: string; name: string | null; area: AreaId | null; verified: boolean;
}
export interface RulerUser {
  id: number; username: string; name: string; role: 'admin' | 'ruler'; area: AreaId | null;
}

export interface Session<TUser> { token: string; expires: string; user: TUser; }

export interface SmsNotification {
  id: number; report_id: string | null; body: string;
  status: string; confirmed: 0 | 1; created: string;
}

export interface Stats { total: number; resolved: number; active: number; categories: number; }

export interface CreateReportInput {
  cat: CategoryId; area: AreaId; ward: string; landmark?: string; desc: string;
}