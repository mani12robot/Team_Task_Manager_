// ============================================================
// js/api.js — Centralized API client
// ============================================================

const API_BASE = '/api';

// ─── Token helpers ─────────────────────────────────────────
const Auth = {
  getToken:  ()         => localStorage.getItem('ttm_token'),
  getUser:   ()         => JSON.parse(localStorage.getItem('ttm_user') || 'null'),
  setSession:(token, user) => {
    localStorage.setItem('ttm_token', token);
    localStorage.setItem('ttm_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('ttm_token');
    localStorage.removeItem('ttm_user');
  },
  isLoggedIn: () => !!localStorage.getItem('ttm_token')
};

// ─── Core fetch wrapper ────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Auth API ──────────────────────────────────────────────
const AuthAPI = {
  login:  (email, password) => apiFetch('/auth/login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password, role) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
  me:     () => apiFetch('/auth/me')
};

// ─── Users API ─────────────────────────────────────────────
const UsersAPI = {
  getAll: () => apiFetch('/users')
};

// ─── Projects API ──────────────────────────────────────────
const ProjectsAPI = {
  getAll:  ()         => apiFetch('/projects'),
  getOne:  (id)       => apiFetch(`/projects/${id}`),
  create:  (data)     => apiFetch('/projects',    { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data) => apiFetch(`/projects/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  delete:  (id)       => apiFetch(`/projects/${id}`, { method: 'DELETE' })
};

// ─── Tasks API ─────────────────────────────────────────────
const TasksAPI = {
  getAll:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/tasks${qs ? '?' + qs : ''}`);
  },
  getOne:   (id)       => apiFetch(`/tasks/${id}`),
  create:   (data)     => apiFetch('/tasks',    { method: 'POST', body: JSON.stringify(data) }),
  update:   (id, data) => apiFetch(`/tasks/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  delete:   (id)       => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
  getStats: ()         => apiFetch('/tasks/stats')
};
