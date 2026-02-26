import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, Scissors, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function BookAppointment() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.id === parseInt(serviceId))
      if (service) setSelectedService(service)
    }
  }, [services, serviceId])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/services/')
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await fetch(`http://localhost:8000/api/appointments/time-slots/available/?date=${date}`)
      const data = await response.json()
      setAvailableSlots(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:8000/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          time_slot_id: selectedSlot.id,
          notes: notes || ''
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/my-appointments'), 2000)
      } else {
        const errorData = await response.json()
        console.error('Error del servidor:', errorData)
        setError(JSON.stringify(errorData))
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const generateDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Formatear la fecha manualmente sin problemas de zona horaria
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      dates.push(`${year}-${month}-${day}`)
    }
    return dates
  }

  // Función para formatear fecha sin problemas de zona horaria
  const formatDateSafe = (dateString) => {
    const [year, month, day] = dateString.split('-')
    const date = new Date(year, month - 1, day)
    return format(date, 'EEEE, d MMMM yyyy', { locale: es })
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Cita Solicitada!</h2>
        <p className="text-gray-600 mb-4">
          Tu cita ha sido solicitada exitosamente. Recibirás una notificación cuando sea confirmada.
        </p>
        <button onClick={() => navigate('/my-appointments')} className="btn-primary">
          Ver Mis Citas
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Reservar Cita</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-pink-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Selecciona un servicio</h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service)
                  setStep(2)
                }}
                className={`card text-left transition-all ${
                  selectedService?.id === service.id ? 'ring-2 ring-pink-500 bg-pink-50' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.duration_minutes} minutos</p>
                  </div>
                  <span className="text-xl font-bold text-pink-600">${service.price.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona una fecha</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {generateDates().map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === date
                      ? 'bg-pink-500 text-white'
                      : 'bg-white border border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <div className="text-xs uppercase">
                    {format(new Date(date + 'T00:00:00'), 'EEE', { locale: es })}
                  </div>
                  <div className="text-lg">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona un horario</h2>
              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay horarios disponibles para esta fecha</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-white border border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      {slot.start_time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">
              Anterior
            </button>
            <button 
              onClick={() => selectedSlot && setStep(3)} 
              disabled={!selectedSlot}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Confirma tu cita</h2>
          
          <div className="card bg-pink-50 border-pink-100 space-y-4">
            <div className="flex items-center gap-3">
              <Scissors className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm text-gray-600">Servicio</p>
                <p className="font-semibold text-gray-800">{selectedService.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-semibold text-gray-800">
                  {formatDateSafe(selectedDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm text-gray-600">Hora</p>
                <p className="font-semibold text-gray-800">{selectedSlot.start_time.substring(0, 5)}</p>
              </div>
            </div>

            <div className="border-t border-pink-200 pt-4">
              <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
              <p className="text-2xl font-bold text-pink-600">${selectedService.price.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Alguna preferencia o comentario..."
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              Anterior
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </span>
              ) : (
                'Confirmar Reserva'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}