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
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // El backend ya filtra por el administrador autenticado
      const response = await api.get('appointments/notifications/')
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      toast.error('No se pudieron cargar los mensajes')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      // Endpoint sincronizado con urls.py para marcar como leída
      await api.post(`appointments/notifications/${id}/read/`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ))
      toast.success('Mensaje leído')
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await api.delete(`appointments/notifications/${id}/`)
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success('Notificación eliminada')
    } catch (error) {
      toast.error('No se pudo eliminar el mensaje')
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    if (unread.length === 0) return

    try {
      await Promise.all(unread.map(n => api.post(`appointments/notifications/${n.id}/read/`)))
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      toast.error('Error al procesar la solicitud')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium font-sans">Sincronizando mensajes...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-20 pt-4">
      {/* Header del Centro de Notificaciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white border border-[#e6e6e6] hover:bg-[#F3E8FF] rounded-2xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#4A008B]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">Centro de Mensajes</h1>
            <p className="text-[#555555] text-sm mt-1">Gestiona las alertas de tu negocio</p>
          </div>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[#4A008B] font-bold text-xs bg-[#F3E8FF] px-6 py-3 rounded-2xl hover:bg-[#E0B3FF] transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            Marcar todo como leído
          </button>
        )}
      </div>

      {/* Lista de Notificaciones */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#e6e6e6] rounded-[2.5rem] py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-[#2C0140] font-tight">Bandeja de entrada vacía</h3>
            <p className="text-[#555555] text-sm max-w-xs mx-auto mt-2">
              No tienes mensajes o alertas pendientes en este momento.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`group relative bg-white p-6 rounded-[2rem] border-2 transition-all duration-300 flex items-start gap-6 ${
                n.is_read 
                  ? 'border-[#e6e6e6] opacity-70' 
                  : 'border-[#4A008B]/10 shadow-lg shadow-purple-900/5 ring-1 ring-[#4A008B]/5'
              }`}
            >
              {/* Indicador de estado visual */}
              {!n.is_read && (
                <div className="absolute top-6 right-6 w-2 h-2 bg-[#0AE8C6] rounded-full shadow-[0_0_10px_rgba(10,232,198,0.5)]" />
              )}

              <div className={`p-4 rounded-2xl flex-shrink-0 ${
                n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-[#F3E8FF] text-[#4A008B]'
              }`}>
                {n.is_read ? <Check size={24} /> : <AlertCircle size={24} className="animate-pulse" />}
              </div>

              <div className="flex-1 space-y-3">
                <p className={`text-base leading-relaxed ${n.is_read ? 'text-[#555555]' : 'text-[#2C0140] font-bold font-tight'}`}>
                  {n.message}
                </p>
                
                <div className="flex items-center gap-6 text-[10px] font-bold text-[#555555] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Calendar size={12} className="text-[#0AE8C6]" />
                    {format(new Date(n.created_at), "d 'de' MMMM", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Clock size={12} className="text-[#0AE8C6]" />
                    {format(new Date(n.created_at), "HH:mm")} hrs
                  </span>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="flex flex-col gap-2">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-3 text-[#4A008B] hover:bg-[#F3E8FF] rounded-xl transition-all"
                    title="Marcar como leída"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}