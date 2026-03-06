import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  MessageCircle, 
  Search, 
  Calendar, 
  Clock, 
  Loader2, 
  X,
  User,
  ChevronRight,
  Scissors // SE AÑADIÓ ESTA IMPORTACIÓN
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import api from "../../api/axios"

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
      const response = await api.get('appointments/')
      setAppointments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar citas:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // --- Lógica de Acciones ---
  const handleAction = async (id, action) => {
    try {
      await api.post(`appointments/${id}/${action}/`)
      toast.success(`Operación exitosa: ${action}`)
      fetchAppointments()
    } catch (error) {
      toast.error('No se pudo completar la acción en el servidor')
    }
  }

  const openReschedule = async (appointment) => {
    setSelectedAppointment(appointment)
    try {
      // Ruta sincronizada con urls.py del backend
      const response = await api.get('appointments/time-slots/available/')
      setAvailableSlots(response.data)
      setShowRescheduleModal(true)
    } catch (error) {
      toast.error('No hay horarios disponibles para reagendar')
    }
  }

  const handleReschedule = async (slotId) => {
    try {
      await api.post(`appointments/${selectedAppointment.id}/reschedule/`, {
        new_time_slot_id: slotId
      })
      toast.success('La cita ha sido reagendada')
      setShowRescheduleModal(false)
      fetchAppointments()
    } catch (error) {
      toast.error('Error al procesar el cambio de horario')
    }
  }

  // --- Formateo Seguro de Fechas ---
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'Pendiente'
    const date = new Date(`${dateStr}T00:00:00`)
    return isValid(date) ? format(date, "d 'de' MMM, yyyy", { locale: es }) : 'Fecha inválida'
  }

  // --- Filtro de Búsqueda Defensivo ---
  const filteredAppointments = appointments.filter(apt => {
    const search = searchTerm.toLowerCase()
    const clientName = `${apt.client_details?.first_name || ''} ${apt.client_details?.last_name || ''}`.toLowerCase()
    const serviceName = (apt.service_details?.name || '').toLowerCase()
    
    const matchesSearch = clientName.includes(search) || serviceName.includes(search)
    const matchesFilter = filter === 'all' ? true : apt.status === filter
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium tracking-tight font-sans">Cargando agenda de Beauty Hogar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140] font-tight">Gestión de Citas</h1>
          <p className="text-[#555555] text-sm">Panel de control de servicios de Beauty Hogar</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por cliente o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#e6e6e6] rounded-xl outline-none focus:ring-2 focus:ring-[#4A008B] transition-all text-sm"
          />
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-widest ${
              filter === f 
                ? 'bg-[#4A008B] text-white border-[#4A008B] shadow-lg shadow-purple-900/20' 
                : 'bg-white text-[#555555] border-[#e6e6e6] hover:border-[#4A008B]/30'
            }`}
          >
            {f === 'all' ? 'Ver Todas' : f}
          </button>
        ))}
      </div>

      {/* Listado de Citas */}
      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#e6e6e6] rounded-2xl py-20 text-center text-[#555555]">
            No se encontraron citas en esta categoría.
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div key={apt.id} className="bg-white border border-[#e6e6e6] rounded-2xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center border border-[#4A008B]/10 font-bold text-[#4A008B] font-tight">
                    {apt.client_details?.first_name?.[0] || <User size={20} />}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#2C0140] text-lg font-tight">
                      {apt.client_details?.first_name} {apt.client_details?.last_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#555555] font-medium">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Scissors size={14} className="text-[#4A008B]" />
                        {apt.service_details?.name}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <Calendar size={14} className="text-[#0AE8C6]" />
                        {formatDateSafe(apt.timeslot_details?.date)}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock size={14} className="text-[#0AE8C6]" />
                        {apt.timeslot_details?.start_time?.substring(0, 5)} hrs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bloque de Acciones */}
                <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0">
                  {apt.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAction(apt.id, 'confirm')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs border border-green-100 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={16} /> Confirmar
                      </button>
                      <button 
                        onClick={() => handleAction(apt.id, 'cancel')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs border border-red-100 hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={16} /> Rechazar
                      </button>
                    </>
                  )}

                  {apt.status === 'confirmed' && (
                    <button 
                      onClick={() => handleAction(apt.id, 'complete')}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#4A008B] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#38006B] transition-colors"
                    >
                      <CheckCircle size={16} /> Finalizar Servicio
                    </button>
                  )}

                  <button 
                    onClick={() => openReschedule(apt)}
                    className="p-2 text-[#555555] hover:bg-gray-100 rounded-xl transition-colors"
                    title="Reagendar"
                  >
                    <RefreshCw size={18} />
                  </button>

                  <a 
                    href={`https://wa.me/${(apt.client_details?.phone || '').replace(/\D/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Reagendamiento */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10">
            <div className="p-6 border-b border-[#e6e6e6] flex items-center justify-between bg-[#F3E8FF]/30">
              <h3 className="text-xl font-bold text-[#2C0140] font-tight">Reagendar Cita</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {availableSlots.length === 0 ? (
                <p className="text-center py-8 text-[#555555] italic">No hay otros horarios disponibles.</p>
              ) : (
                availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => handleReschedule(slot.id)}
                    className="w-full p-4 border border-[#e6e6e6] rounded-2xl flex items-center justify-between group hover:border-[#4A008B] hover:bg-[#F3E8FF]/20 transition-all"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#4A008B] uppercase tracking-widest">{slot.date}</p>
                      <p className="text-[#2C0140] font-bold">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)} hrs</p>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-[#4A008B] transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}