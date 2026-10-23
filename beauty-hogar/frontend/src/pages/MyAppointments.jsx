import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Scissors, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  MessageCircle, 
  Loader2,
  User
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import api from '../api/axios'

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await api.get('appointments/')
      setAppointments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar tus citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (id) => {
    if (!confirm('¿Deseas cancelar esta cita?')) return
    try {
      await api.post(`appointments/${id}/cancel/`)
      toast.success('Cita cancelada correctamente')
      fetchAppointments()
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo cancelar la cita')
    }
  }

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'Fecha pendiente'
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return 'Fecha inválida'
      return format(date, "EEE d 'de' MMM", { locale: es })
    } catch (e) {
      return 'Error en fecha'
    }
  }

  const getStatusStyles = (status) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-[#F3E8FF] text-[#4A008B] border-[#4A008B]/10'
    }
    return styles[status] || styles.pending
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rescheduled: 'Reagendada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      rescheduled: RefreshCw,
      cancelled: XCircle,
      completed: CheckCircle
    }
    const Icon = icons[status] || AlertCircle
    return <Icon className="w-3.5 h-3.5" />
  }

  const getWhatsAppLink = (appointment) => {
    const phone = '+56951415619' 
    const date = appointment.timeslot_details?.date || ''
    const service = appointment.service_details?.name || 'servicio'
    const message = `Hola Beauty Hogar, tengo una consulta sobre mi cita de ${service} para el día ${date}.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true
    if (filter === 'active') return ['pending', 'confirmed', 'rescheduled'].includes(apt.status)
    if (filter === 'past') return ['completed', 'cancelled'].includes(apt.status)
    return apt.status === filter
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-10 h-10 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] text-xs font-medium">Sincronizando tus citas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140] font-tight">Mis Citas</h1>
          <p className="text-xs text-[#555555]">Seguimiento de tus reservas en vivo</p>
        </div>
        
        <div className="grid grid-cols-3 gap-1.5 bg-gray-200/70 p-1 rounded-2xl">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'active', label: 'Próximas' },
            { id: 'past', label: 'Historial' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-white text-[#4A008B] shadow-xs'
                  : 'text-[#555555]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e6e6e6] rounded-3xl py-14 px-4 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-[#2C0140]">Sin citas en esta sección</h3>
          <p className="text-[#555555] mb-5 text-xs max-w-xs mx-auto mt-1">
            No tienes citas {filter === 'active' ? 'próximas' : filter === 'past' ? 'en tu historial' : ''} por ahora.
          </p>
          <Link 
            to="/book" 
            className="inline-block px-6 py-3 bg-[#4A008B] text-white text-xs font-bold rounded-2xl shadow-md"
          >
            Agendar un Servicio
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="bg-white rounded-3xl border border-[#e6e6e6] p-4 sm:p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center shrink-0 text-[#4A008B]">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#2C0140] truncate font-tight">
                      {appointment.service_details?.name || 'Servicio'}
                    </h3>
                    <p className="text-[11px] text-[#4A008B] font-bold flex items-center gap-1 mt-0.5">
                      <User size={12} />
                      {appointment.service_details?.provider_email?.split('@')[0] || 'Profesional'}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shrink-0 ${getStatusStyles(appointment.status)}`}>
                  {getStatusIcon(appointment.status)}
                  {getStatusLabel(appointment.status)}
                </span>
              </div>

              {/* Fecha, Hora y Precio en fila compacta */}
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-bold text-[#2C0140] capitalize">
                    <Calendar className="w-3.5 h-3.5 text-[#0AE8C6]" />
                    {formatDateSafe(appointment.timeslot_details?.date)}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-[#2C0140]">
                    <Clock className="w-3.5 h-3.5 text-[#0AE8C6]" />
                    {appointment.timeslot_details?.start_time?.substring(0, 5) || '--:--'} hrs
                  </span>
                </div>
                <span className="text-sm font-bold text-[#4A008B] font-tight">
                  ${parseFloat(appointment.total_price || 0).toLocaleString()}
                </span>
              </div>

              {appointment.notes && (
                <div className="px-3.5 py-2 bg-purple-50/50 rounded-xl border-l-3 border-[#4A008B] text-xs text-[#555555]">
                  <span className="font-bold text-[#4A008B] mr-1">Nota:</span>
                  {appointment.notes}
                </div>
              )}

              {/* Botones de Acción Móviles */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={getWhatsAppLink(appointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2C0140] text-white py-2.5 px-4 rounded-xl text-xs font-bold active:scale-98 transition-transform"
                >
                  <MessageCircle className="w-4 h-4 text-[#0AE8C6]" />
                  Consultar por WhatsApp
                </a>

                {['pending', 'confirmed', 'rescheduled'].includes(appointment.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancelAppointment(appointment.id)}
                    className="py-2.5 px-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 active:scale-98"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
