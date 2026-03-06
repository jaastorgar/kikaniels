import { useState, useEffect } from 'react'
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
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
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
      // El backend filtrará automáticamente las citas del cliente logueado
      const response = await api.get('appointments/')
      setAppointments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar tus citas:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Procesa la fecha de forma segura. 
   * Usamos parseISO para asegurar que la fecha de la DB se interprete correctamente.
   */
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'Fecha pendiente'
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return 'Fecha inválida'
      return format(date, "EEEE, d 'de' MMMM", { locale: es })
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
    // En un sistema multi-admin, aquí podrías usar el teléfono del profesional si estuviera en service_details
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium font-sans">Sincronizando tus citas con Beauty Hogar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-[#2C0140] font-tight tracking-tight">Mis Citas</h1>
          <p className="text-[#555555] font-medium">Revisa el estado de tus servicios y reservas</p>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'active', label: 'Próximas' },
            { id: 'past', label: 'Historial' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === f.id
                  ? 'bg-white text-[#4A008B] shadow-sm'
                  : 'text-[#555555] hover:text-[#4A008B]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#e6e6e6] rounded-[2.5rem] py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-[#2C0140] font-tight">Sin citas en esta categoría</h3>
          <p className="text-[#555555] mb-8 text-sm max-w-xs mx-auto mt-2">
            No tienes citas {filter === 'active' ? 'pendientes' : filter === 'past' ? 'pasadas' : ''} actualmente.
          </p>
          <button 
            onClick={() => window.location.href='/book'} 
            className="px-10 py-4 bg-[#4A008B] text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-purple-100"
          >
            Agendar un Servicio
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="bg-white rounded-[2rem] border border-[#e6e6e6] p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              {/* Decoración sutil de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F3E8FF]/20 rounded-full -mr-16 -mt-16 group-hover:bg-[#F3E8FF]/40 transition-colors" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-[#F3E8FF] rounded-3xl flex items-center justify-center flex-shrink-0 border border-[#4A008B]/5 group-hover:bg-[#4A008B] transition-all duration-500 shadow-sm">
                    <Scissors className="w-10 h-10 text-[#4A008B] group-hover:text-white group-hover:scale-110 transition-all" />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-2xl font-bold text-[#2C0140] font-tight leading-none">
                        {appointment.service_details?.name || 'Servicio Premium'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-[#4A008B]">
                         <User size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">
                           Profesional: {appointment.service_details?.provider_email?.split('@')[0] || 'Beauty Pro'}
                         </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <Calendar className="w-4 h-4 text-[#0AE8C6]" />
                        <span className="text-sm font-bold text-[#2C0140] capitalize">
                          {formatDateSafe(appointment.timeslot_details?.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <Clock className="w-4 h-4 text-[#0AE8C6]" />
                        <span className="text-sm font-bold text-[#2C0140]">
                          {appointment.timeslot_details?.start_time?.substring(0, 5) || '--:--'} hrs
                        </span>
                      </div>
                      <div className="text-xl font-bold text-[#4A008B] font-tight ml-auto lg:ml-0">
                        ${parseFloat(appointment.total_price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-6 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  <span className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-2 flex items-center gap-2 shadow-sm ${getStatusStyles(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {appointment.status}
                  </span>
                  
                  <a
                    href={getWhatsAppLink(appointment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-[#2C0140] text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-[#4A008B] hover:shadow-xl transition-all active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5 text-[#0AE8C6]" />
                    Asistencia WhatsApp
                  </a>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-6 p-4 bg-gray-50/50 rounded-2xl border-l-4 border-[#4A008B] text-xs text-[#555555] font-medium leading-relaxed italic">
                   <span className="not-italic font-bold text-[#4A008B] mr-1 opacity-60 uppercase tracking-tighter">Tu nota:</span> 
                   "{appointment.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}