import axios from 'axios';

// Creamos la instancia centralizada de Axios
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

/* INTERCEPTOR DE PETICIONES:
   Este bloque se ejecuta automáticamente antes de que cada petición salga al servidor.
   Sirve para inyectar el token de seguridad (JWT) sin tener que escribirlo en cada archivo.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Inyectamos el token en el formato estándar de Django Rest Framework
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Si hay un error antes de enviar la petición, lo rechazamos
    return Promise.reject(error);
  }
);

/* INTERCEPTOR DE RESPUESTAS (Opcional pero recomendado):
   Aquí puedes manejar errores globales, como cuando el token expira (401).
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Opcional: Podrías forzar el logout si el token ya no es válido
      console.warn("Sesión expirada. Redirigiendo al login...");
    }
    return Promise.reject(error);
  }
);

export default api;