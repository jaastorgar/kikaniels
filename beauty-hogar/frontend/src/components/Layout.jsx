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
  Home,
  Download,
  X
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import api, { getWebSocketUrl } from '../api/axios';

const Layout = ({ children, admin = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);

  // Captura el evento de instalación nativa PWA (Android / Desktop / Chrome)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // 1. Carga de notificaciones optimizada
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('appointments/notifications/unread_count/');
      setUnreadCount(response.data.unread_count ?? response.data.count ?? 0);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Sesión no autorizada para notificaciones');
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, location.pathname]);

  // 2. Gestión de WebSockets (Conexión estable web y nativa)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token || socketRef.current) return;

    const socket = new WebSocket(getWebSocketUrl(token));
    socketRef.current = socket;

    socket.onopen = () => console.log('✅ WebSocket Conectado');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'appointment_update' || data.type === 'notification') {
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
      if (socket.readyState === 1 || socket.readyState === 0) {
        socket.close();
      }
      socketRef.current = null;
    };
  }, [user?.id, admin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = admin ? [
    { name: 'Panel Principal', shortName: 'Panel', path: '/admin', icon: LayoutDashboard },
    { name: 'Citas', shortName: 'Citas', path: '/admin/appointments', icon: Calendar },
    { name: 'Servicios', shortName: 'Servicios', path: '/admin/services', icon: Scissors },
    { name: 'Horarios', shortName: 'Horarios', path: '/admin/timeslots', icon: Clock },
    { name: 'Clientes', shortName: 'Clientes', path: '/admin/clients', icon: Users },
  ] : [
    { name: 'Inicio', shortName: 'Inicio', path: '/', icon: Home },
    { name: 'Servicios', shortName: 'Servicios', path: '/services', icon: Scissors },
    { name: 'Mis Citas', shortName: 'Citas', path: '/my-appointments', icon: Calendar },
    { name: 'Reservar', shortName: 'Reservar', path: '/book', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-[#343A40] select-none sm:select-auto">
      <Toaster position="top-right" richColors closeButton />

      {/* Backdrop móvil para cerrar menú lateral */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
      
      {/* Sidebar - Color corporativo: #2C0140 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#2C0140] text-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0AE8C6]">Beauty Hogar</h1>
              <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest opacity-70">
                {admin ? 'Panel Administrativo' : 'Portal de Clientes'}
              </p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-purple-200 hover:text-white">
              <X size={20} />
            </button>
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

          <div className="p-4 border-t border-purple-900 space-y-2">
            {installPrompt && (
              <button
                onClick={handleInstallApp}
                className="flex items-center space-x-3 w-full px-4 py-3 bg-[#0AE8C6] text-[#2C0140] font-bold rounded-xl transition-transform active:scale-95"
              >
                <Download size={18} />
                <span className="text-sm">Instalar App</span>
              </button>
            )}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-[#e6e6e6] h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-[#343A40] rounded-xl hover:bg-gray-100">
              <Menu size={24} />
            </button>
            <span className="lg:hidden font-bold text-lg text-[#2C0140] font-tight">Beauty Hogar</span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 ml-auto">
            {installPrompt && (
              <button
                onClick={handleInstallApp}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0AE8C6] text-[#2C0140] text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-all"
              >
                <Download size={15} />
                Instalar App
              </button>
            )}

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
            
            <div className="flex items-center space-x-3 pl-3 sm:pl-4 border-l border-[#e6e6e6]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#2C0140]">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-[#555555] font-bold uppercase">
                  {user?.role === 'admin' || user?.is_admin ? 'Administrador' : 'Cliente'}
                </p>
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

        {/* Barra de Navegación Inferior Nativa para Móviles */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#e6e6e6] z-30 flex items-center justify-around py-2 px-1 shadow-lg">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-[#4A008B] font-bold' : 'text-[#555555]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#4A008B]' : 'text-gray-400'} />
                <span className="text-[10px] mt-0.5">{item.shortName}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
