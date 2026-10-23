import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const activeToken = token || localStorage.getItem('token');
    if (!user || !activeToken) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/ws/appointments/?token=${activeToken}`;
    
    const socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'appointment_update' || data.type === 'appointment_notification' || data.type === 'notification') {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado.");
    };

    return () => socket.close();
  }, [user, token]);

  return { notifications, unreadCount, setUnreadCount };
};
