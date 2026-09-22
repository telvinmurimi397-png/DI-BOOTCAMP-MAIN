export type AreaId = string; // Or a specific union like: 'kilimani' | 'westlands' | 'cbd';

export interface Session<T = unknown> {
  token: string;
  user?: T;
}

export interface ResidentUser {
  id: number;
  phone: string;
  name: string | null;
  area: AreaId | null;
  verified: boolean;
  subscribed: boolean;
}