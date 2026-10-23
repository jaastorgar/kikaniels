import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://10.0.2.2:8000').replace(/\/+$/, '');

// En web local usamos '/api' (proxy de Vite). En Capacitor nativo usamos la URL completa del backend.
export const API_BASE_URL = isNative ? `${rawApiUrl}/api` : '/api';

export const getWebSocketUrl = (token) => {
  if (isNative) {
    const wsBase = rawApiUrl.replace(/^http/, 'ws');
    return `${wsBase}/ws/appointments/?token=${token}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/appointments/?token=${token}`;
};

// Instancia centralizada de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// INTERCEPTOR DE PETICIONES: Inyecta el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INTERCEPTOR DE RESPUESTAS
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Sesión expirada. Redirigiendo al inicio de sesión...");
    }
    return Promise.reject(error);
  }
);

export default api;
