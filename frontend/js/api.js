const API = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearAuth();
  window.location.href = '/login';
}

// Redirect if not logged in
function requireAuth() {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

// Redirect if not admin
function requireAdmin() {
  const user = requireAuth();
  if (user && user.role !== 'ADMIN') {
    window.location.href = '/profile';
    return null;
  }
  return user;
}

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = 'alert alert-' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function avatarSrc(pic) {
  return pic ? pic : 'https://ui-avatars.com/api/?background=4f46e5&color=fff&name=User&size=100';
}