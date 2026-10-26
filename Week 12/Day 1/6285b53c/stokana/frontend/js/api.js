export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...headers },
    signal
  };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('We could not reach STOKANA. Check your connection and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status}).`, {
      status: response.status,
      code: data?.code || null,
      details: data?.details || null
    });
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};

export function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    search.set(key, String(value));
  });
  const result = search.toString();
  return result ? `?${result}` : '';
}
