import { useState, useEffect } from 'react'
import { Calendar, Clock, Scissors, AlertCircle, CheckCircle, XCircle, RefreshCw, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setAppointments(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      rescheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || colors.pending
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      rescheduled: RefreshCw,
      cancelled: XCircle,
      completed: CheckCircle
    }
    return icons[status] || AlertCircle
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rescheduled: 'Reagendada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    }
    return texts[status] || status
  }

  const getWhatsAppLink = (appointment) => {
    const phone = '+56951415619'
    let message = ''
    
    switch(appointment.status) {
      case 'confirmed':
        message = `Hola, mi cita para ${appointment.service.name} el ${appointment.time_slot.date} ha sido confirmada. ¿Podemos coordinar los detalles?`
        break
      case 'cancelled':
        message = `Hola, mi cita para ${appointment.service.name} el ${appointment.time_slot.date} fue cancelada. ¿Podemos agendar otra fecha?`
        break
      case 'rescheduled':
        message = `Hola, mi cita para ${appointment.service.name} fue reagendada al ${appointment.time_slot.date} ${appointment.time_slot.start_time}. ¿Confirmamos?`
        break
      default:
        message = `Hola, tengo una consulta sobre mi cita para ${appointment.service.name}`
    }
    
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Mis Citas</h1>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'active', label: 'Activas' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'confirmed', label: 'Confirmadas' },
            { key: 'past', label: 'Pasadas' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes citas</h3>
          <p className="text-gray-500">Reserva tu primera cita ahora</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const StatusIcon = getStatusIcon(appointment.status)
            return (
              <div key={appointment.id} className="card card-hover">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{appointment.service.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(appointment.time_slot.date), 'EEEE, d MMMM yyyy', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time_slot.start_time.substring(0, 5)}
                        </span>
                        <span className="font-medium text-primary-600">
                          ${appointment.service.price.toLocaleString()}
                        </span>
                      </div>
                      
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Nota: {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                      <StatusIcon className="w-4 h-4" />
                      {getStatusText(appointment.status)}
                    </span>
                    
                    <a
                      href={getWhatsAppLink(appointment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}