export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: string;
  headers?: Record<string, string>;
}

export const API_BASE = 'http://localhost:8000';

export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = localStorage.getItem('mtaafix_token');
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = await fetch(API_BASE + path, {
    method,
    headers,
    body: options.body || null,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export function loginResident(phone: string, password: string) {
  return request('/api/residents/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
}

export function loginRuler(username: string, password: string) {
  return request('/api/rulers/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
