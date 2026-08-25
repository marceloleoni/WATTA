export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const mensagem = data?.erro || `Erro na requisição (${response.status})`;
    throw new Error(mensagem);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
