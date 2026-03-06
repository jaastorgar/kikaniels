import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !token) return;

    // Usamos el protocolo ws:// (o wss:// en producción)
    // El proxy de Vite se encarga de redirigir /ws a localhost:8000
    const socketUrl = `ws://${window.location.host}/ws/appointments/`;
    
    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Aquí recibimos lo que envía tu 'utils.py' del backend
      if (data.type === 'appointment_notification') {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Aquí podríamos disparar un sonido o un Toast (lo veremos luego)
        console.log("Nueva notificación:", data.message);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado. Reintentando...");
      // Aquí podrías implementar una lógica de reconexión
    };

    return () => socket.close();
  }, [user, token]);

  return { notifications, unreadCount, setUnreadCount };
};