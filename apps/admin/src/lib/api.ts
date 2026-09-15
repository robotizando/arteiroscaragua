import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'admin_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((requestConfig) => {
  const token = getStoredToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: string } | undefined)?.error;
    if (message) return message;
  }
  return fallback;
}
