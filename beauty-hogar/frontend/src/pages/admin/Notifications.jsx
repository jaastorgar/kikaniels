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
  Scissors,
  User,
  ExternalLink
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api, { getWebSocketUrl } from '../../api/axios'

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = new WebSocket(getWebSocketUrl(token))

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'appointment_update' || data.type === 'notification') {
        fetchNotifications()
      }
    }

    return () => socket.close()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('appointments/notifications/')
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error('No se pudo actualizar la bandeja de entrada')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.post(`appointments/notifications/${id}/read/`)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    if (unread.length === 0) return

    try {
      await Promise.all(unread.map(n => api.post(`appointments/notifications/${n.id}/read/`)))
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      toast.success('Bandeja marcada como leída')
    } catch (error) {
      toast.error('Error en el proceso masivo')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await api.delete(`appointments/notifications/${id}/`)
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success('Mensaje eliminado')
    } catch (error) {
      toast.error('No se pudo borrar el registro')
    }
  }

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return ''
      return format(date, "d 'de' MMM", { locale: es })
    } catch (e) {
      return ''
    }
  }

  const formatTimeSafe = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return ''
      return `${format(date, "HH:mm")} hrs`
    } catch (e) {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
        <Loader2 className="w-9 h-9 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium text-xs uppercase tracking-widest">
          Sincronizando agenda...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 font-sans pb-6">
      {/* Encabezado con Acciones Globales */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin')} 
            className="w-10 h-10 bg-white border border-[#e6e6e6] active:scale-95 rounded-xl flex items-center justify-center shadow-xs text-[#2C0140]"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C0140] font-tight leading-tight">
              Avisos del Negocio
            </h1>
            <p className="text-[#555555] text-xs">
              Actividad de reservas en tiempo real
            </p>
          </div>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="px-3 py-2 bg-[#F3E8FF] text-[#4A008B] rounded-xl text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
          >
            <CheckCircle2 size={14} />
            <span>Leer todo</span>
          </button>
        )}
      </div>

      {/* Listado Dinámico */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl py-14 px-4 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-[#2C0140]">Sin actividad reciente</h3>
            <p className="text-[#555555] text-xs max-w-xs mx-auto mt-1">
              Las nuevas citas aparecerán aquí automáticamente en tiempo real.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`bg-white p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                n.is_read 
                  ? 'border-[#ececec] opacity-75' 
                  : 'border-[#4A008B]/25 shadow-sm'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-[#F3E8FF] text-[#4A008B]'
                }`}>
                  {n.is_read ? <Check size={20} /> : <AlertCircle size={20} />}
                </div>
                {!n.is_read && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#0AE8C6] border-2 border-white rounded-full shadow-xs" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                <p className={`text-sm leading-snug break-words ${
                  n.is_read ? 'text-[#555555]' : 'text-[#2C0140] font-bold'
                }`}>
                  {n.message}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#555555]">
                  <span className="inline-flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <Calendar size={12} className="text-[#4A008B]" /> 
                    {formatDateSafe(n.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    <Clock size={12} className="text-[#4A008B]" /> 
                    {formatTimeSafe(n.created_at)}
                  </span>
                </div>

                {/* Tarjeta de Cita Vinculada */}
                {n.appointment_details && (
                  <div className="bg-[#F3E8FF]/40 rounded-xl p-2.5 border border-purple-100 flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#2C0140]">
                        <Scissors size={13} className="text-[#4A008B]" />
                        {n.appointment_details.service_details?.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#555555]">
                        <User size={13} className="text-[#4A008B]" />
                        {n.appointment_details.client_details?.first_name}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate('/admin/appointments')}
                      className="text-[11px] font-bold text-[#4A008B] flex items-center gap-1"
                    >
                      Ver cita <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-2 text-[#4A008B] bg-[#F3E8FF]/60 hover:bg-[#F3E8FF] rounded-xl transition-colors"
                    title="Marcar como leída"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar registro"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
