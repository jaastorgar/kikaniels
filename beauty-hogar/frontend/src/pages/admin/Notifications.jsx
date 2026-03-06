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
import { format, parseISO } from 'date-fns'
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

    // CONEXIÓN EN TIEMPO REAL (WebSocket)
    const socket = new WebSocket(`ws://localhost:8000/ws/appointments/`)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'notification') {
        toast.info(data.message, { 
          icon: <Bell className="text-[#4A008B]" />,
          duration: 6000 
        })
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
      console.error('Error al cargar notificaciones:', error)
      toast.error('No se pudo actualizar la bandeja de entrada')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      // SOLUCIÓN AL 404: Ahora apunta a /read/ para coincidir con el backend
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
      // Sincronizado masivamente con el endpoint /read/
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium font-sans animate-pulse text-sm uppercase tracking-widest">
          Sincronizando agenda de Beauty Hogar...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-20 pt-4 px-4">
      {/* Encabezado con Acciones Globales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')} 
            className="p-3 bg-white border border-[#e6e6e6] hover:bg-[#F3E8FF] rounded-2xl transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 text-[#4A008B] group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">Notificaciones de Negocio</h1>
            <p className="text-[#555555] text-sm mt-1 font-medium">Historial de reservas para tu centro</p>
          </div>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[#4A008B] font-bold text-[10px] uppercase tracking-widest bg-[#F3E8FF] px-6 py-4 rounded-2xl hover:bg-[#E0B3FF] transition-all flex items-center gap-2 border border-[#4A008B]/10 active:scale-95 shadow-lg shadow-purple-900/5"
          >
            <CheckCircle2 size={16} />
            Marcar todo como leído
          </button>
        )}
      </div>

      {/* Listado Dinámico */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#e6e6e6] rounded-[3rem] py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-[#2C0140] font-tight">Sin actividad reciente</h3>
            <p className="text-[#555555] text-sm max-w-xs mx-auto mt-2">
              Las nuevas citas aparecerán aquí automáticamente en tiempo real.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`group relative bg-white p-7 rounded-[2.5rem] border-2 transition-all duration-300 flex items-start gap-6 ${
                n.is_read 
                  ? 'border-[#e6e6e6] opacity-60 grayscale-[0.5]' 
                  : 'border-[#4A008B]/20 shadow-xl shadow-purple-900/5 ring-1 ring-[#4A008B]/5'
              }`}
            >
              {!n.is_read && (
                <div className="absolute top-10 right-10 w-2.5 h-2.5 bg-[#0AE8C6] rounded-full shadow-[0_0_15px_rgba(10,232,198,0.7)]" />
              )}

              <div className={`p-4 rounded-2xl flex-shrink-0 transition-all ${
                n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-[#F3E8FF] text-[#4A008B] scale-105'
              }`}>
                {n.is_read ? <Check size={24} /> : <AlertCircle size={24} className="animate-pulse" />}
              </div>

              <div className="flex-1 space-y-5">
                <div className="space-y-2">
                  <p className={`text-lg leading-tight ${n.is_read ? 'text-[#555555]' : 'text-[#2C0140] font-bold font-tight'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-4 text-[9px] font-bold text-[#555555] uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Calendar size={12} className="text-[#0AE8C6]" /> 
                      {format(parseISO(n.created_at), "d 'de' MMMM", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Clock size={12} className="text-[#0AE8C6]" /> 
                      {format(parseISO(n.created_at), "HH:mm")} hrs
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Cita Vinculada */}
                {n.appointment_details && (
                  <div className="bg-[#F3E8FF]/30 rounded-3xl p-5 border border-purple-100/50 flex flex-wrap gap-5 items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg"><Scissors size={14} className="text-[#4A008B]" /></div>
                          <span className="text-xs font-bold text-[#2C0140] font-tight">{n.appointment_details.service_details.name}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg"><User size={14} className="text-[#4A008B]" /></div>
                          <span className="text-xs font-bold text-[#555555]">{n.appointment_details.client_details.first_name}</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => navigate('/admin/appointments')}
                      className="text-[10px] font-bold text-[#4A008B] hover:text-[#0AE8C6] flex items-center gap-2 uppercase tracking-widest transition-colors"
                    >
                      Gestionar Agenda <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-3 text-[#4A008B] hover:bg-[#F3E8FF] rounded-2xl transition-all border border-transparent hover:border-[#4A008B]/10"
                    title="Marcar como leída"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all border border-transparent hover:border-red-100"
                  title="Eliminar registro"
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