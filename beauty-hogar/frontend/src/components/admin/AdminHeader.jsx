import { useState, useEffect } from 'react'
import { Bell, User, LogOut, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
    
    // Polling de seguridad: Actualiza el contador cada 30 segundos
    // Esto asegura que la campana se active incluso si el WebSocket falla
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      // Endpoint especializado que devuelve solo el número de no leídas
      const response = await api.get('appointments/notifications/unread_count/')
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error("Error al sincronizar notificaciones de Beauty Hogar")
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-[#e6e6e6] px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Lado Izquierdo: Buscador Global (Opcional/Visual) */}
      <div className="hidden md:flex items-center relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Buscar citas o clientes..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#4A008B]/20 outline-none text-xs transition-all"
        />
      </div>

      {/* Lado Derecho: Notificaciones y Perfil */}
      <div className="flex items-center gap-4 lg:gap-8 ml-auto">
        
        {/* Campana de Notificaciones con Badge Dinámico */}
        <button 
          onClick={() => navigate('/admin/notifications')}
          className="relative p-2.5 text-[#555555] hover:bg-[#F3E8FF] hover:text-[#4A008B] rounded-2xl transition-all group"
        >
          <Bell size={22} className="group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Perfil del Administrador */}
        <div className="flex items-center gap-4 border-l border-[#e6e6e6] pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#2C0140] font-tight leading-none mb-1">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[10px] font-bold text-[#4A008B] uppercase tracking-[0.15em] opacity-70">
              Admin Pro
            </p>
          </div>
          
          <div className="group relative">
            <button className="w-11 h-11 bg-gradient-to-br from-[#4A008B] to-[#7B1FA2] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100 active:scale-95 transition-all">
              <User size={20} />
            </button>
            
            {/* Menú Desplegable de Usuario */}
            <div className="absolute right-0 mt-3 w-48 bg-white border border-[#e6e6e6] rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-2 z-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}