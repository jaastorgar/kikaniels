import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, MessageCircle, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

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
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${id}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const openRescheduleModal = async (appointment) => {
    setSelectedAppointment(appointment)
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/time-slots/available/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setAvailableSlots(data)
      setShowRescheduleModal(true)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReschedule = async (newSlotId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/${selectedAppointment.id}/reschedule/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ new_time_slot_id: newSlotId })
      })
      if (response.ok) {
        setShowRescheduleModal(false)
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getWhatsAppLink = (appointment) => {
    const phone = appointment.client.phone.replace(/\D/g, '')
    const message = `Hola ${appointment.client.first_name}, te contacto de Beauty Hogar sobre tu cita para ${appointment.service.name}.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rescheduled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.pending
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesFilter = filter === 'all' || apt.status === filter
    const matchesSearch = 
      apt.client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Citas</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="rescheduled">Reagendadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Servicio</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fecha/Hora</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{apt.client.first_name} {apt.client.last_name}</div>
                    <div className="text-sm text-gray-500">{apt.client.email}</div>
                    <div className="text-sm text-gray-500">{apt.client.phone}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{apt.service.name}</div>
                    <div className="text-sm text-gray-500">${apt.service.price.toLocaleString()}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    <div>{apt.time_slot.date}</div>
                    <div className="text-sm">{apt.time_slot.start_time.substring(0, 5)} - {apt.time_slot.end_time.substring(0, 5)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(apt.id, 'confirm')}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            title="Confirmar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(apt.id, 'cancel')}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {(apt.status === 'confirmed' || apt.status === 'rescheduled') && (
                        <>
                          <button
                            onClick={() => openRescheduleModal(apt)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            title="Reagendar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(apt.id, 'complete')}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            title="Completar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <a
                        href={getWhatsAppLink(apt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Reagendar Cita</h3>
              <p className="text-gray-600 text-sm">Selecciona un nuevo horario disponible</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleReschedule(slot.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <div className="font-medium text-gray-800">{slot.date}</div>
                    <div className="text-sm text-gray-600">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-full btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}