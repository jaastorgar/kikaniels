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
  X,
  PlusCircle
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

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('appointments/notifications/unread_count/');
      setUnreadCount(response.data.unread_count ?? response.data.count ?? 0);
    } catch (error) {
      // Silencioso en caso de expiración
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token || socketRef.current) return;

    const socket = new WebSocket(getWebSocketUrl(token));
    socketRef.current = socket;

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

  const profilePath = admin ? '/admin/profile' : '/profile';

  // Menú completo para Sidebar lateral
  const sidebarItems = admin ? [
    { name: 'Panel Principal', path: '/admin', icon: LayoutDashboard },
    { name: 'Citas', path: '/admin/appointments', icon: Calendar },
    { name: 'Servicios', path: '/admin/services', icon: Scissors },
    { name: 'Horarios', path: '/admin/timeslots', icon: Clock },
    { name: 'Clientes', path: '/admin/clients', icon: Users },
    { name: 'Mi Perfil', path: '/admin/profile', icon: User },
  ] : [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Servicios', path: '/services', icon: Scissors },
    { name: 'Agendar Cita', path: '/book', icon: PlusCircle },
    { name: 'Mis Citas', path: '/my-appointments', icon: Calendar },
    { name: 'Mi Perfil', path: '/profile', icon: User },
  ];

  // 5 Pestañas principales para la Barra Inferior Nativa en Móviles
  const bottomTabs = admin ? [
    { name: 'Panel', path: '/admin', icon: LayoutDashboard },
    { name: 'Citas', path: '/admin/appointments', icon: Calendar },
    { name: 'Servicios', path: '/admin/services', icon: Scissors },
    { name: 'Horarios', path: '/admin/timeslots', icon: Clock },
    { name: 'Perfil', path: '/admin/profile', icon: User },
  ] : [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Servicios', path: '/services', icon: Scissors },
    { name: 'Reservar', path: '/book', icon: PlusCircle, highlight: true },
    { name: 'Mis Citas', path: '/my-appointments', icon: Calendar },
    { name: 'Perfil', path: '/profile', icon: User },
  ];

  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#343A40] select-none sm:select-auto">
      <Toaster position="top-center" richColors closeButton />

      {/* Backdrop móvil para cerrar menú lateral */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
      
      {/* Sidebar Lateral (Escritorio + Drawer Móvil) */}
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
                {admin ? 'Modo Profesional' : 'App Clientes'}
              </p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 text-purple-200 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm
                    ${isActive 
                      ? 'bg-[#4A008B] text-[#0AE8C6] font-bold shadow-lg' 
                      : 'text-purple-100 hover:bg-[#38006B] hover:text-white font-medium'}
                  `}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
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
              className="flex items-center space-x-3 w-full px-4 py-3 text-purple-200 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-sm"
            >
              <LogOut size={19} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-20 lg:pb-0">
        {/* Top App Bar Estilo Nativo */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#ececec] h-14 sm:h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-[#2C0140] rounded-xl active:bg-gray-100"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <Link to={admin ? "/admin" : "/"} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2C0140] flex items-center justify-center lg:hidden">
                <Scissors size={15} className="text-[#0AE8C6]" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-[#2C0140] font-tight leading-none block">
                  Beauty Hogar
                </span>
                <span className="text-[9px] font-bold text-[#4A008B] uppercase tracking-widest block lg:hidden">
                  {admin ? 'Panel Admin' : 'Belleza en Casa'}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
            {installPrompt && (
              <button
                onClick={handleInstallApp}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0AE8C6] text-[#2C0140] text-xs font-bold rounded-xl shadow-xs"
              >
                <Download size={14} />
                Instalar
              </button>
            )}

            <Link 
              to={admin ? "/admin/notifications" : "/notifications"}
              className="p-2 text-[#2C0140] hover:bg-gray-100 rounded-xl relative transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#0AE8C6] text-[#2C0140] text-[10px] font-black min-w-[17px] h-[17px] flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            <Link
              to={profilePath}
              className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-[#ececec] group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#2C0140] group-hover:text-[#4A008B] transition-colors">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] text-[#555555] font-bold uppercase">
                  {user?.role === 'admin' || user?.is_admin ? 'Administrador' : 'Cliente'}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-[#4A008B] to-[#2C0140] text-[#0AE8C6] rounded-xl flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Contenido Principal Compacto y Amigable */}
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>

        {/* Barra de Navegación Inferior Nativa para Móviles */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e6e6e6] z-30 flex items-center justify-around py-1.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {bottomTabs.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.highlight) {
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-[#0AE8C6] text-[#2C0140]'
                      : 'bg-[#4A008B] text-white'
                  }`}>
                    <Icon size={22} />
                  </div>
                  <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-[#4A008B]' : 'text-[#555555]'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive ? 'text-[#4A008B] font-bold' : 'text-[#555555]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#4A008B]' : 'text-gray-400'} />
                <span className="text-[10px] mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
