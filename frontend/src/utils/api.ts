const STORAGE_KEY = 'storytelling_user_auth';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type RequestOpts = {
  headers?: Record<string, string>;
  auth?: boolean;
};

async function request(path: string, method = 'GET', body?: any, opts: RequestOpts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { ...(opts.headers || {}) };

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (opts.auth ?? true) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token) headers.Authorization = `Bearer ${parsed.token}`;
      }
    } catch {}
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body && body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err: any = new Error((data && data.message) || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path: string, opts?: RequestOpts) => request(path, 'GET', undefined, opts),
  post: (path: string, body?: any, opts?: RequestOpts) => request(path, 'POST', body, opts),
  patch: (path: string, body?: any, opts?: RequestOpts) => request(path, 'PATCH', body, opts),
  del: (path: string, opts?: RequestOpts) => request(path, 'DELETE', undefined, opts),
};

export default api;
