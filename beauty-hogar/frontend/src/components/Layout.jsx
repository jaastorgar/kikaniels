import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  Clock, 
  LogOut, 
  Menu, 
  Bell, 
  User,
  Home
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const Layout = ({ children, admin = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null); // Ref para mantener una única conexión

  // 1. Carga de notificaciones optimizada
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Ruta relativa limpia para usar la baseURL '/api'
      const response = await api.get('appointments/notifications/unread_count/');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Sesión no autorizada para notificaciones');
      }
    }
  }, [user?.id]); // Solo cambia si el ID del usuario cambia

  // 2. Gestión de WebSockets (Conexión estable)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token || socketRef.current) return;

    fetchNotifications();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/ws/appointments/?token=${token}`;
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log('✅ WebSocket Conectado');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'appointment_update') {
        setUnreadCount(prev => prev + 1);
        
        toast(data.message, {
          description: "Actualización en tiempo real",
          icon: data.status === 'cancelled' ? '❌' : '✨',
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => navigate(admin ? "/admin/appointments" : "/my-appointments")
          },
        });
      }
    };

    socket.onclose = () => {
      console.log('❌ WebSocket Desconectado');
      socketRef.current = null;
    };

    return () => {
      if (socket.readyState === 1) {
        socket.close();
      }
    };
  }, [user?.id, admin, navigate, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = admin ? [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Citas', path: '/admin/appointments', icon: Calendar },
    { name: 'Servicios', path: '/admin/services', icon: Scissors },
    { name: 'Horarios', path: '/admin/timeslots', icon: Clock },
    { name: 'Clientes', path: '/admin/clients', icon: Users },
  ] : [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Servicios', path: '/services', icon: Scissors },
    { name: 'Mis Citas', path: '/my-appointments', icon: Calendar },
    { name: 'Reservar', path: '/book', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-[#343A40]">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar - Color corporativo: #2C0140 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#2C0140] text-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0AE8C6]">Beauty Hogar</h1>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest opacity-70">
              {admin ? 'Panel Administrativo' : 'Portal de Clientes'}
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-[#4A008B] text-[#0AE8C6] shadow-lg' 
                      : 'text-purple-100 hover:bg-[#38006B] hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-purple-900">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-purple-200 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#e6e6e6] h-16 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-[#343A40]">
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <Link 
              to={admin ? "/admin/notifications" : "/notifications"}
              className="p-2 text-[#555555] hover:bg-gray-100 rounded-full relative transition-colors"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#0AE8C6] text-[#2C0140] text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-[#e6e6e6]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#2C0140]">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-[#555555] font-bold uppercase">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-[#F3E8FF] text-[#4A008B] rounded-full flex items-center justify-center border border-[#4A008B]/10">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;