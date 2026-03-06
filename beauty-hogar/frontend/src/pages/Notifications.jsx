import { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()

    // MEJORA: CONEXIÓN EN TIEMPO REAL
    // Mantiene una línea abierta con el servidor para recibir avisos al instante
    const socket = new WebSocket(`ws://localhost:8000/ws/appointments/`)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'notification') {
        // Alerta visual tipo Toast para feedback inmediato
        toast.info(data.message, { 
          icon: <Bell className="text-[#4A008B]" />,
          duration: 5000 
        })
        // Recarga automática de la lista para mostrar el mensaje nuevo
        fetchNotifications()
      }
    }

    // Limpieza al desmontar el componente para evitar fugas de memoria
    return () => socket.close()
  }, [])

  const fetchNotifications = async () => {
    try {
      // El backend filtra automáticamente las notificaciones del cliente autenticado
      const response = await api.get('appointments/notifications/')
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      toast.error('No pudimos actualizar tus mensajes')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      // SOLUCIÓN AL 404: Apunta al endpoint /read/ sincronizado con la vista del backend
      await api.post(`appointments/notifications/${id}/read/`)
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      toast.error('No se pudo marcar como leída')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await api.delete(`appointments/notifications/${id}/`)
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success('Mensaje eliminado')
    } catch (error) {
      toast.error('No se pudo eliminar la notificación')
    }
  }

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return ''
      return format(date, "d 'de' MMMM", { locale: es })
    } catch (e) {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 font-sans">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium animate-pulse text-sm uppercase tracking-widest">
          Sincronizando avisos...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 font-sans pt-6 px-4">
      {/* Header con Navegación y Estilo Beauty Hogar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white border border-[#e6e6e6] hover:bg-[#F3E8FF] rounded-2xl transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 text-[#4A008B] group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">Notificaciones</h1>
            <p className="text-[#555555] text-sm mt-1">Sigue el estado de tus servicios en vivo</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F3E8FF] rounded-full text-[#4A008B] text-[10px] font-bold uppercase tracking-widest border border-[#4A008B]/10">
           <Sparkles size={14} className="text-[#0AE8C6]" /> Mis Avisos
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`group relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex items-start gap-6 ${
                n.is_read 
                  ? 'bg-white border-[#e6e6e6] opacity-70' 
                  : 'bg-white border-[#4A008B]/20 shadow-xl shadow-purple-900/5 ring-1 ring-[#4A008B]/5'
              }`}
            >
              {/* Indicador de Mensaje Nuevo con el color Turquesa */}
              {!n.is_read && (
                <div className="absolute top-8 right-8 w-2 h-2 bg-[#0AE8C6] rounded-full shadow-[0_0_12px_rgba(10,232,198,0.8)]" />
              )}

              <div className={`p-4 rounded-2xl flex-shrink-0 transition-colors ${
                n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-[#F3E8FF] text-[#4A008B]'
              }`}>
                {n.is_read ? <CheckCircle2 size={24} /> : <AlertCircle size={24} className="animate-pulse" />}
              </div>

              <div className="flex-1 space-y-3">
                <p className={`text-base leading-relaxed ${n.is_read ? 'text-[#555555]' : 'text-[#2C0140] font-bold font-tight'}`}>
                  {n.message}
                </p>
                
                <div className="flex items-center gap-6 text-[10px] font-bold text-[#555555] uppercase tracking-[0.15em]">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <Calendar size={12} className="text-[#0AE8C6]" />
                    {formatDateSafe(n.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <Clock size={12} className="text-[#0AE8C6]" />
                    {format(parseISO(n.created_at), "HH:mm")} hrs
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-3 text-[#4A008B] hover:bg-[#F3E8FF] rounded-xl transition-all shadow-sm"
                    title="Marcar como leída"
                  >
                    <Check size={20} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all shadow-sm"
                  title="Eliminar aviso"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado vacío mejorado */
        <div className="bg-white border-2 border-dashed border-[#e6e6e6] rounded-[3rem] py-24 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Bell className="text-gray-200" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-[#2C0140] font-tight tracking-tight">Bandeja de avisos limpia</h3>
          <p className="text-[#555555] text-sm max-w-xs mx-auto mt-2 font-medium">
            No tienes avisos pendientes. Te notificaremos cuando haya novedades en tus citas.
          </p>
        </div>
      )}
    </div>
  )
}