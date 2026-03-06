import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Scissors, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  AlertCircle, 
  User 
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

export default function BookAppointment() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === parseInt(serviceId))
      if (service) setSelectedService(service)
    }
  }, [services, serviceId])

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots(selectedDate, selectedService.provider)
    }
  }, [selectedDate, selectedService])

  const fetchServices = async () => {
    try {
      const response = await api.get('appointments/services/')
      setServices(Array.isArray(response.data) ? response.data.filter(s => s.is_active) : [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    }
  }

  const fetchAvailableSlots = async (date, providerId) => {
    setFetchingSlots(true)
    setError('')
    try {
      // Filtrado por fecha y profesional para garantizar consistencia
      const response = await api.get('appointments/time-slots/', {
        params: { 
          date: date,
          provider_id: providerId 
        }
      })
      setAvailableSlots(response.data)
    } catch (error) {
      setError('No se pudo sincronizar la agenda de la profesional.')
    } finally {
      setFetchingSlots(false)
    }
  }

  // --- LÓGICA DE ENVÍO ACTUALIZADA (MENSAJES DINÁMICOS) ---
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const payload = {
        service: selectedService.id,
        timeslot: selectedSlot.id,
        notes: notes || ''
        // total_price se calcula en el backend por seguridad
      }

      await api.post('appointments/', payload)
      setSuccess(true)
      setTimeout(() => navigate('/my-appointments'), 2500)
    } catch (error) {
      const serverError = error.response?.data
      
      // Procesamiento dinámico del error de Django REST Framework
      if (serverError && typeof serverError === 'object') {
        // Extraemos el primer mensaje de error de cualquier campo (ej: 'timeslot', 'non_field_errors')
        const errorMessages = Object.values(serverError).flat()
        setError(errorMessages[0] || 'No se pudo procesar la reserva.')
      } else {
        setError('Ocurrió un error inesperado. Por favor, intenta más tarde.')
      }
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
      dates.push(format(date, 'yyyy-MM-dd'))
    }
    return dates
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[#0AE8C6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-[#0AE8C6]" />
        </div>
        <h2 className="text-3xl font-bold text-[#2C0140] mb-3 font-tight">¡Cita Solicitada!</h2>
        <p className="text-[#555555] mb-10 font-medium">Hemos avisado a la profesional. Te notificaremos su confirmación en breve.</p>
        <button onClick={() => navigate('/my-appointments')} className="w-full py-4 bg-[#4A008B] text-white font-bold rounded-2xl shadow-xl hover:bg-[#38006B] transition-all">
          Ir a Mis Citas
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 font-sans pt-6 px-4">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-3 bg-white border border-[#e6e6e6] hover:bg-[#F3E8FF] rounded-2xl transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5 text-[#4A008B]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">Agendar Cita</h1>
          <p className="text-xs font-bold text-[#555555] uppercase tracking-widest mt-2">Paso {step} de 3</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex gap-3 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-[#4A008B]' : 'bg-gray-100'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold text-[#2C0140] font-tight">¿Qué servicio necesitas hoy?</h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service); setStep(2); }}
                className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 group ${
                  selectedService?.id === service.id 
                    ? 'border-[#4A008B] bg-[#F3E8FF]/30 ring-4 ring-[#4A008B]/5' 
                    : 'border-[#e6e6e6] bg-white hover:border-[#0AE8C6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B] group-hover:scale-110 transition-transform">
                      <Scissors size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C0140] text-lg font-tight">{service.name}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] font-bold text-[#555555] uppercase flex items-center gap-1">
                          <Clock size={12} /> {service.duration} min
                        </span>
                        <span className="text-[10px] font-bold text-[#4A008B] uppercase bg-white/50 w-fit px-2 py-0.5 rounded-lg border border-purple-100">
                          Atiende: {service.provider_email ? service.provider_email.split('@')[0] : 'Profesional'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-[#4A008B] font-tight">${parseFloat(service.price).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2C0140] font-tight">Selecciona el día</h2>
              <div className="flex items-center gap-2 bg-[#F3E8FF] px-4 py-2 rounded-2xl border border-purple-100">
                <User size={14} className="text-[#4A008B]" />
                <span className="text-[10px] font-bold text-[#4A008B] uppercase tracking-wider">Agenda de: {selectedService?.provider_email?.split('@')[0]}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {generateDates().map((date) => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                  className={`p-5 rounded-[1.8rem] text-center transition-all border-2 ${
                    selectedDate === date
                      ? 'bg-[#4A008B] border-[#4A008B] text-white shadow-xl transform scale-105'
                      : 'bg-white border-[#e6e6e6] hover:border-[#0AE8C6]'
                  }`}
                >
                  <div className={`text-[9px] uppercase font-bold mb-1 ${selectedDate === date ? 'text-purple-200' : 'text-[#555555]'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE', { locale: es })}
                  </div>
                  <div className="text-xl font-bold font-tight">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-xl font-bold text-[#2C0140] mb-6 font-tight">Horarios para este día</h2>
              {fetchingSlots ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <Loader2 className="animate-spin text-[#4A008B]" />
                  <p className="text-[10px] font-bold text-[#555555] uppercase tracking-widest">Consultando disponibilidad...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-gray-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-[#e6e6e6]">
                  <p className="text-[#555555] font-medium italic">No hay turnos configurados para este día.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                        selectedSlot?.id === slot.id
                          ? 'bg-[#0AE8C6] border-[#0AE8C6] text-[#2C0140] shadow-lg'
                          : 'bg-white border-[#e6e6e6] hover:border-[#4A008B]'
                      }`}
                    >
                      {slot.start_time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-[#e6e6e6] text-[#555555] font-bold rounded-2xl hover:bg-gray-50 transition-colors">
              Cambiar Servicio
            </button>
            <button 
              onClick={() => selectedSlot && setStep(3)} 
              disabled={!selectedSlot}
              className="flex-1 py-4 bg-[#4A008B] text-white font-bold rounded-2xl shadow-xl disabled:opacity-30 transition-all"
            >
              Siguiente Paso
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold text-[#2C0140] font-tight">Verifica los detalles</h2>
          
          <div className="bg-white rounded-[2.5rem] p-8 space-y-6 border border-[#e6e6e6] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B]"><Scissors size={24} /></div>
              <div>
                <p className="text-[10px] text-[#555555] uppercase font-bold tracking-widest">Servicio</p>
                <p className="font-bold text-[#2C0140] text-lg">{selectedService.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B]"><CalendarIcon size={24} /></div>
                <div>
                  <p className="text-[10px] text-[#555555] uppercase font-bold tracking-widest">Fecha</p>
                  <p className="font-bold text-[#2C0140] capitalize">{format(new Date(selectedDate + 'T00:00:00'), 'EEEE d', { locale: es })}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B]"><Clock size={24} /></div>
                <div>
                  <p className="text-[10px] text-[#555555] uppercase font-bold tracking-widest">Hora</p>
                  <p className="font-bold text-[#2C0140]">{selectedSlot.start_time.substring(0, 5)} hrs</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
              <span className="text-sm font-bold text-[#555555]">Total a pagar (a domicilio)</span>
              <span className="text-3xl font-bold text-[#4A008B] font-tight">${parseFloat(selectedService.price).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#555555] uppercase tracking-widest ml-2">¿Quieres añadir una nota?</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-6 bg-white border-2 border-[#e6e6e6] rounded-[2rem] focus:border-[#4A008B] outline-none text-sm min-h-[120px]"
              placeholder="Ej: Dirección exacta, avisar al llegar..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-4 border-2 border-[#e6e6e6] text-[#555555] font-bold rounded-2xl hover:bg-gray-50 transition-colors">
              Modificar Fecha
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 bg-[#4A008B] text-white rounded-2xl font-bold shadow-2xl hover:bg-[#38006B] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}