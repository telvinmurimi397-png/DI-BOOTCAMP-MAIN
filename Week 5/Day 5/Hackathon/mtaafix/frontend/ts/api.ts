import type { ResidentUser, Session } from './types';

declare function getToken(kind: string): string | null;
declare function setToken(kind: string, value: string | null): void;
declare function request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, kind?: string): Promise<T>;

export const residentApi = {
  residentToken: () => getToken('resident'),

  async residentLogin(phone: string, name?: string, area?: string, subscribe = true): Promise<Session<ResidentUser>> {
    const s = await request<Session<ResidentUser>>('POST', '/api/residents/login', { phone, name, area, subscribe });
    setToken('resident', s.token);
    return s;
  },

  setSubscription: (subscribe: boolean) =>
    request<{ subscribed: boolean }>('POST', '/api/residents/subscription', { subscribe }, 'resident'),

  async residentLogout(): Promise<void> {
    await request('POST', '/api/residents/logout', {}, 'resident').catch(() => undefined);
    setToken('resident', null);
  },

  residentMe: () => request<{ user: ResidentUser }>('GET', '/api/residents/me', undefined, 'resident'),
};