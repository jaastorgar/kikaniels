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
  User,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../api/axios'

export default function BookAppointment() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [selectedSpecialistId, setSelectedSpecialistId] = useState('all')
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
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === parseInt(serviceId))
      if (service) {
        setSelectedService(service)
        if (service.provider) {
          setSelectedSpecialistId(service.provider)
        }
        setStep(2)
      }
    }
  }, [services, serviceId])

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots(selectedDate, selectedSpecialistId)
    }
  }, [selectedDate, selectedService, selectedSpecialistId])

  const fetchInitialData = async () => {
    try {
      const [srvRes, specRes] = await Promise.all([
        api.get('appointments/services/'),
        api.get('users/specialists/')
      ])
      setServices(Array.isArray(srvRes.data) ? srvRes.data.filter(s => s.is_active) : [])
      setSpecialists(Array.isArray(specRes.data) ? specRes.data : [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const fetchAvailableSlots = async (date, providerId) => {
    setFetchingSlots(true)
    setError('')
    try {
      const params = { date }
      if (providerId && providerId !== 'all') {
        params.provider_id = providerId
      }
      const response = await api.get('appointments/time-slots/available/', { params })
      setAvailableSlots(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      setError('No se pudo sincronizar la agenda de los especialistas.')
    } finally {
      setFetchingSlots(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const payload = {
        service: selectedService.id,
        timeslot: selectedSlot.id,
        worker: selectedSlot.provider,
        notes: notes || ''
      }

      await api.post('appointments/', payload)
      setSuccess(true)
      setTimeout(() => navigate('/my-appointments'), 2200)
    } catch (error) {
      const serverError = error.response?.data
      if (serverError && typeof serverError === 'object') {
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
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-[#0AE8C6]/15 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-[#0AE8C6]" />
        </div>
        <h2 className="text-2xl font-bold text-[#2C0140] mb-2 font-tight">¡Cita Solicitada!</h2>
        <p className="text-sm text-[#555555] mb-8">
          Hemos notificado a tu especialista ({selectedSlot?.provider_name || 'Beauty Hogar'}). Te confirmaremos en breve.
        </p>
        <button
          onClick={() => navigate('/my-appointments')}
          className="w-full py-3.5 bg-[#4A008B] text-white font-bold rounded-2xl shadow-lg text-sm"
        >
          Ir a Mis Citas
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pb-8 font-sans space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="w-10 h-10 bg-white border border-[#e6e6e6] rounded-xl flex items-center justify-center shadow-xs text-[#4A008B]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C0140] font-tight leading-tight">
            Agendar Cita
          </h1>
          <p className="text-[11px] font-bold text-[#4A008B] uppercase tracking-wider">
            Paso {step} de 3
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle size={18} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#4A008B]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* PASO 1: ELEGIR SERVICIO */}
      {step === 1 && (
        <div className="space-y-3.5">
          <h2 className="text-base font-bold text-[#2C0140] font-tight">1. ¿Qué servicio necesitas hoy?</h2>
          <div className="grid gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service)
                  if (service.provider) {
                    setSelectedSpecialistId(service.provider)
                  }
                  setStep(2)
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                  selectedService?.id === service.id 
                    ? 'border-[#4A008B] bg-[#F3E8FF]/40' 
                    : 'border-[#e6e6e6] bg-white hover:border-[#4A008B]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 bg-[#F3E8FF] rounded-xl text-[#4A008B] flex items-center justify-center shrink-0">
                    <Scissors size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#2C0140] text-sm sm:text-base truncate">{service.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[11px] font-semibold text-[#555555] flex items-center gap-1">
                        <Clock size={12} className="text-[#4A008B]" /> {service.duration} min
                      </span>
                      {service.provider_name && (
                        <span className="text-[11px] font-bold text-[#4A008B] flex items-center gap-1">
                          • <User size={11} /> {service.provider_name}
                          {service.provider_specialty ? ` (${service.provider_specialty})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#4A008B] font-tight shrink-0">
                  ${parseFloat(service.price).toLocaleString('es-CL')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: ELEGIR ESPECIALISTA, FECHA Y HORA */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Selección de Especialista */}
          <div>
            <h2 className="text-sm font-bold text-[#2C0140] mb-2.5 flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#4A008B]" />
              Elige tu Especialista
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
              <button
                type="button"
                onClick={() => { setSelectedSpecialistId('all'); setSelectedSlot(null); }}
                className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all ${
                  selectedSpecialistId === 'all'
                    ? 'bg-[#4A008B] border-[#4A008B] text-white shadow-sm'
                    : 'bg-white border-[#e6e6e6] text-[#2C0140]'
                }`}
              >
                <p className="text-xs font-bold">Cualquier especialista</p>
                <p className={`text-[10px] ${selectedSpecialistId === 'all' ? 'text-purple-200' : 'text-[#555555]'}`}>
                  Ver todos los horarios
                </p>
              </button>

              {specialists.map((spec) => {
                const isSelected = String(selectedSpecialistId) === String(spec.id)
                return (
                  <button
                    type="button"
                    key={spec.id}
                    onClick={() => { setSelectedSpecialistId(spec.id); setSelectedSlot(null); }}
                    className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#4A008B] border-[#4A008B] text-white shadow-sm'
                        : 'bg-white border-[#e6e6e6] text-[#2C0140]'
                    }`}
                  >
                    <p className="text-xs font-bold">{spec.full_name}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-[#0AE8C6]' : 'text-[#4A008B]'} font-semibold`}>
                      {spec.specialty_display}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selección de Día */}
          <div>
            <h2 className="text-sm font-bold text-[#2C0140] mb-2.5">Selecciona el día</h2>
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
              {generateDates().map((date) => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                  className={`w-16 py-3 rounded-2xl text-center transition-all border shrink-0 ${
                    selectedDate === date
                      ? 'bg-[#4A008B] border-[#4A008B] text-white shadow-md'
                      : 'bg-white border-[#e6e6e6]'
                  }`}
                >
                  <div className={`text-[10px] uppercase font-bold ${selectedDate === date ? 'text-purple-200' : 'text-[#555555]'}`}>
                    {format(new Date(date + 'T00:00:00'), 'EEE', { locale: es })}
                  </div>
                  <div className="text-base font-bold font-tight mt-0.5">{date.split('-')[2]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selección de Horario */}
          {selectedDate && (
            <div>
              <h2 className="text-sm font-bold text-[#2C0140] mb-2.5">Horarios disponibles</h2>
              {fetchingSlots ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Loader2 className="animate-spin text-[#4A008B] w-6 h-6" />
                  <p className="text-[11px] font-bold text-[#555555]">Consultando disponibilidad...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-[#dcdcdc]">
                  <p className="text-xs text-[#555555] font-medium">
                    No hay turnos disponibles para este día. Prueba otra fecha o especialista.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-2xl text-left transition-all border ${
                        selectedSlot?.id === slot.id
                          ? 'bg-[#0AE8C6] border-[#0AE8C6] text-[#2C0140] shadow-sm'
                          : 'bg-white border-[#e6e6e6] hover:border-[#4A008B]'
                      }`}
                    >
                      <p className="text-sm font-bold">{slot.start_time.substring(0, 5)} hrs</p>
                      <p className="text-[10px] font-semibold text-[#4A008B] truncate mt-0.5">
                        {slot.provider_name || 'Especialista'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 border border-[#e6e6e6] bg-white text-[#555555] font-bold rounded-2xl text-xs"
            >
              Cambiar Servicio
            </button>
            <button 
              onClick={() => selectedSlot && setStep(3)} 
              disabled={!selectedSlot}
              className="flex-1 py-3.5 bg-[#4A008B] text-white font-bold rounded-2xl shadow-md disabled:opacity-40 text-xs"
            >
              Siguiente Paso
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: CONFIRMACIÓN */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-base font-bold text-[#2C0140] font-tight">3. Confirma tu Reserva</h2>
          
          <div className="bg-white rounded-3xl p-5 space-y-4 border border-[#e6e6e6] shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-[#F3E8FF] rounded-2xl text-[#4A008B] flex items-center justify-center">
                <Scissors size={20} />
              </div>
              <div>
                <p className="text-[10px] text-[#555555] uppercase font-bold">Servicio</p>
                <p className="font-bold text-[#2C0140] text-base">{selectedService.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-[#F3E8FF] rounded-2xl text-[#4A008B] flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-[#555555] uppercase font-bold">Especialista</p>
                <p className="font-bold text-[#2C0140] text-sm">
                  {selectedSlot?.provider_name || 'Especialista Beauty Hogar'}
                </p>
                {selectedSlot?.provider_specialty && (
                  <p className="text-xs text-[#4A008B] font-semibold">{selectedSlot.provider_specialty}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <p className="text-[10px] text-[#555555] uppercase font-bold">Fecha</p>
                <p className="font-bold text-[#2C0140] text-xs capitalize mt-0.5">
                  {format(new Date(selectedDate + 'T00:00:00'), "EEEE d 'de' MMM", { locale: es })}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <p className="text-[10px] text-[#555555] uppercase font-bold">Hora</p>
                <p className="font-bold text-[#2C0140] text-xs mt-0.5">
                  {selectedSlot.start_time.substring(0, 5)} hrs
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-[#555555]">Total del Servicio</span>
              <span className="text-2xl font-bold text-[#4A008B] font-tight">
                ${parseFloat(selectedService.price).toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2C0140]">Dirección o indicaciones (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-white border border-[#e6e6e6] rounded-2xl focus:border-[#4A008B] outline-none text-xs min-h-[90px]"
              placeholder="Ej: Dirección exacta, depto, referencias o indicaciones para el especialista..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3.5 border border-[#e6e6e6] bg-white text-[#555555] font-bold rounded-2xl text-xs"
            >
              Cambiar Horario
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3.5 bg-[#4A008B] text-white rounded-2xl font-bold shadow-md text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
