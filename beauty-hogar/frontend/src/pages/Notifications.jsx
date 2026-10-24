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
  Wallet,
  ShieldCheck
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api, { getWebSocketUrl } from '../api/axios'

export default function Notifications() {
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
      toast.error('No pudimos actualizar tus mensajes')
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
      toast.error('No se pudo marcar como leída')
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
      toast.error('No se pudieron actualizar todas las notificaciones')
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

  const cleanNotificationMessage = (msg = '') => {
    return msg.replace(/^[^\w¡¿$]+/u, '').trim()
  }

  const getNotificationVisual = (msg = '', isRead = false) => {
    const lower = msg.toLowerCase()
    if (lower.includes('pago') || lower.includes('liquidado') || lower.includes('comisión')) {
      return {
        Icon: Wallet,
        style: isRead ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }
    }
    if (lower.includes('habilitado') || lower.includes('confirmada') || lower.includes('completada')) {
      return {
        Icon: CheckCircle2,
        style: isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#0AE8C6]/15 text-[#068874] border border-[#0AE8C6]/40'
      }
    }
    if (lower.includes('deshabilitado') || lower.includes('cancelada')) {
      return {
        Icon: AlertCircle,
        style: isRead ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700 border border-amber-200'
      }
    }
    if (lower.includes('servicio') || lower.includes('precio') || lower.includes('duración')) {
      return {
        Icon: Scissors,
        style: isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#F3E8FF] text-[#4A008B] border border-purple-200'
      }
    }
    return {
      Icon: ShieldCheck,
      style: isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#F3E8FF] text-[#4A008B] border border-purple-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 font-sans">
        <Loader2 className="w-9 h-9 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium text-xs uppercase tracking-widest">
          Sincronizando avisos...
        </p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6 font-sans">
      {/* Encabezado compacto estilo app móvil */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-[#e6e6e6] active:scale-95 rounded-xl flex items-center justify-center shadow-xs text-[#2C0140]"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2C0140] font-tight leading-tight">
              Notificaciones
            </h1>
            <p className="text-[#555555] text-xs">
              Sigue el estado de tus servicios en vivo
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 bg-[#F3E8FF] text-[#4A008B] rounded-xl text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
          >
            <CheckCircle2 size={14} />
            <span>Leer todo</span>
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const visual = getNotificationVisual(n.message, n.is_read)
            const NotifIcon = visual.Icon
            return (
            <div 
              key={n.id} 
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                n.is_read 
                  ? 'bg-white border-[#ececec] opacity-75' 
                  : 'bg-white border-[#4A008B]/25 shadow-sm'
              }`}
            >
              {/* Icono vectorial profesional con punto indicador integrado */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${visual.style}`}>
                  <NotifIcon size={19} strokeWidth={1.75} />
                </div>
                {!n.is_read && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#0AE8C6] border-2 border-white rounded-full shadow-xs" />
                )}
              </div>

              {/* Contenido principal con ancho libre y sin superposición */}
              <div className="flex-1 min-w-0 space-y-2">
                <p className={`text-sm leading-snug break-words ${
                  n.is_read ? 'text-[#555555]' : 'text-[#2C0140] font-bold'
                }`}>
                  {cleanNotificationMessage(n.message)}
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
              </div>

              {/* Acciones compactas a la derecha */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-2 text-[#4A008B] bg-[#F3E8FF]/60 hover:bg-[#F3E8FF] rounded-xl transition-colors"
                    title="Marcar como leída"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Eliminar aviso"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl py-14 px-4 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell className="text-gray-300" size={28} />
          </div>
          <h3 className="text-base font-bold text-[#2C0140]">Bandeja de avisos limpia</h3>
          <p className="text-[#555555] text-xs max-w-xs mx-auto mt-1">
            No tienes avisos pendientes. Te notificaremos cuando haya novedades en tus citas.
          </p>
        </div>
      )}
    </div>
  )
}
