import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || '/api';
const TOKEN_KEY = 'swifteats_token';
const REFRESH_TOKEN_KEY = 'swifteats_refresh_token';
const USER_KEY = 'swifteats_user';
const SESSION_EXPIRED_KEY = 'swifteats_session_expired';

const authApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let refreshPromise = null;

export function persistSession(data) {
  clearSessionExpiredFlag();

  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  if (data?.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }

  if (data?.userId) {
    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function markSessionExpired(message = 'Your session expired. Please sign in again.') {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, message);
}

export function consumeSessionExpiredMessage() {
  const message = sessionStorage.getItem(SESSION_EXPIRED_KEY);
  if (message) {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  }
  return message;
}

export function clearSessionExpiredFlag() {
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin() {
  if (!window.location.pathname.startsWith('/login')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await authApi.post('/auth/refresh', { refreshToken });
  persistSession(response.data);
  return response.data.token;
}

function shouldBypassRefresh(config) {
  const url = config?.url || '';
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/forgot-password')
    || url.includes('/auth/reset-password')
    || url.includes('/auth/refresh');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !shouldBypassRefresh(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        clearSession();
        markSessionExpired();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !shouldBypassRefresh(originalRequest || {})) {
      clearSession();
      markSessionExpired();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
