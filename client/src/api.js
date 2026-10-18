const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}

export function saveSession(token, user) {
  sessionStorage.setItem('propertyDeskToken', token);
  sessionStorage.setItem('propertyDeskUser', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('propertyDeskToken');
  sessionStorage.removeItem('propertyDeskUser');
}