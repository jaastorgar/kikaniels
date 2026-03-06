import { useState, useEffect } from 'react'
import { Bell, User, LogOut, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Carga inicial del contador desde la base de datos
    fetchUnreadCount()
    
    // 2. CONEXIÓN EN TIEMPO REAL: Escuchar el canal de notificaciones
    const socket = new WebSocket(`ws://localhost:8000/ws/appointments/`)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'notification') {
        // Incrementamos el contador y disparamos animación visual
        setUnreadCount(prev => prev + 1)
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1500)
      }
    }

    // Polling de seguridad (opcional, cada 60s) para asegurar sincronía
    const interval = setInterval(fetchUnreadCount, 60000)

    return () => {
      socket.close()
      clearInterval(interval)
    }
  }, [])

  const fetchUnreadCount = async () => {
    try {
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
    <header className="bg-white border-b border-[#e6e6e6] px-8 py-4 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Buscador Global Estilizado */}
      <div className="hidden md:flex items-center relative w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Buscar servicios o clientes..." 
          className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-[1.2rem] focus:bg-white focus:border-[#4A008B]/20 outline-none text-xs transition-all placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-6 lg:gap-10 ml-auto">
        {/* Campana de Notificaciones con Efectos Real-time */}
        <button 
          onClick={() => navigate('/admin/notifications')}
          className={`relative p-3 rounded-2xl transition-all duration-500 group ${
            isAnimating ? 'bg-[#F3E8FF] ring-4 ring-purple-50' : 'text-[#555555] hover:bg-gray-50 hover:text-[#4A008B]'
          }`}
        >
          <Bell 
            size={22} 
            className={`transition-transform ${isAnimating ? 'animate-bounce text-[#4A008B]' : 'group-hover:rotate-12'}`} 
          />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0AE8C6] text-[10px] font-black text-[#2C0140] shadow-lg ring-2 ring-white animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Perfil del Administrador */}
        <div className="flex items-center gap-5 border-l border-[#e6e6e6] pl-8">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2 mb-1">
              <Sparkles size={12} className="text-[#0AE8C6]" />
              <p className="text-sm font-bold text-[#2C0140] font-tight leading-none">
                {user?.first_name || 'Admin'}
              </p>
            </div>
            <p className="text-[10px] font-bold text-[#4A008B] uppercase tracking-[0.2em] opacity-60">
              Panel de Control
            </p>
          </div>
          
          <div className="group relative">
            <button className="w-12 h-12 bg-gradient-to-br from-[#4A008B] to-[#7B1FA2] rounded-[1.3rem] flex items-center justify-center text-white shadow-xl shadow-purple-900/10 active:scale-95 transition-all">
              <User size={22} />
            </button>
            
            {/* Menú Desplegable con Estilo Premium */}
            <div className="absolute right-0 mt-4 w-52 bg-white border border-[#e6e6e6] rounded-[2rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-3 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 mb-2 border-b border-gray-50">
                   <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest">Sesión activa</p>
                   <p className="text-xs font-bold text-[#2C0140] truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all text-sm font-bold"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}