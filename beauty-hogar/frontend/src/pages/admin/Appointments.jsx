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
  Scissors,
  UserCheck,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import api from "../../api/axios"

const STATUS_FILTER_LABELS = {
  all: 'Todas',
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  rescheduled: 'Reagendadas',
  completed: 'Completadas',
  cancelled: 'Canceladas'
}

const STATUS_BADGE_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  rescheduled: 'Reagendada',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const STATUS_BADGE_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-[#0AE8C6]/10 text-[#07a68e] border-[#0AE8C6]/30',
  rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200'
}

const ACTION_SUCCESS_LABELS = {
  confirm: 'Cita confirmada exitosamente',
  cancel: 'Cita cancelada',
  complete: 'Servicio finalizado y comisión calculada'
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [aptsRes, specsRes] = await Promise.all([
        api.get('appointments/'),
        api.get('users/specialists/')
      ])
      setAppointments(Array.isArray(aptsRes.data) ? aptsRes.data : [])
      setSpecialists(Array.isArray(specsRes.data) ? specsRes.data : [])
    } catch (error) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      await api.post(`appointments/${id}/${action}/`)
      toast.success(ACTION_SUCCESS_LABELS[action] || 'Operación realizada con éxito')
      fetchData()
    } catch (error) {
      toast.error('No se pudo completar la acción en el servidor')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`appointments/${id}/mark-paid/`)
      toast.success('Comisión del especialista marcada como pagada')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo registrar el pago')
    }
  }

  const handleAssignWorker = async (workerId) => {
    if (!selectedAppointment) return
    try {
      await api.post(`appointments/${selectedAppointment.id}/assign-worker/`, {
        worker_id: workerId
      })
      toast.success('Especialista asignado a la cita')
      setShowAssignModal(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo asignar el especialista')
    }
  }

  const openReschedule = async (appointment) => {
    setSelectedAppointment(appointment)
    try {
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
      fetchData()
    } catch (error) {
      toast.error('Error al procesar el cambio de horario')
    }
  }

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'Pendiente'
    const date = new Date(`${dateStr}T00:00:00`)
    return isValid(date) ? format(date, "d 'de' MMM, yyyy", { locale: es }) : 'Fecha inválida'
  }

  const filteredAppointments = appointments.filter(apt => {
    const search = searchTerm.toLowerCase()
    const clientName = `${apt.client_details?.first_name || ''} ${apt.client_details?.last_name || ''}`.toLowerCase()
    const serviceName = (apt.service_details?.name || '').toLowerCase()
    const workerName = `${apt.worker_details?.first_name || ''} ${apt.worker_details?.last_name || ''}`.toLowerCase()
    
    const matchesSearch = clientName.includes(search) || serviceName.includes(search) || workerName.includes(search)
    const matchesFilter = filter === 'all' ? true : apt.status === filter
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-10 h-10 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] text-xs font-bold uppercase tracking-widest">Cargando agenda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C0140] font-tight">Gestión de Citas</h1>
          <p className="text-[#555555] text-xs">Control de reservas, asignación de especialistas y comisiones</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por cliente, servicio o especialista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e6e6e6] rounded-xl outline-none focus:ring-2 focus:ring-[#4A008B] transition-all text-xs"
          />
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filter === f 
                ? 'bg-[#4A008B] text-white border-[#4A008B] shadow-sm' 
                : 'bg-white text-[#555555] border-[#e6e6e6]'
            }`}
          >
            {STATUS_FILTER_LABELS[f] || f}
          </button>
        ))}
      </div>

      {/* Listado de Citas */}
      <div className="grid gap-3.5">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border border-dashed border-[#e6e6e6] rounded-2xl py-16 text-center text-xs text-[#555555]">
            No se encontraron citas en esta categoría.
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const hasWorkerCommission = apt.worker_details?.role === 'worker' && Number(apt.worker_earnings) > 0
            return (
              <div key={apt.id} className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 bg-[#F3E8FF] rounded-2xl flex items-center justify-center border border-[#4A008B]/10 font-bold text-[#4A008B] shrink-0">
                      {apt.client_details?.first_name?.[0] || <User size={18} />}
                    </div>
                    
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#2C0140] text-base font-tight">
                          {apt.client_details?.first_name} {apt.client_details?.last_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_BADGE_STYLES[apt.status] || STATUS_BADGE_STYLES.pending}`}>
                          {STATUS_BADGE_LABELS[apt.status] || apt.status}
                        </span>
                        <span className="text-sm font-bold text-[#4A008B]">
                          ${Number(apt.total_price).toLocaleString('es-CL')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555555] font-semibold">
                        <span className="inline-flex items-center gap-1 text-[#2C0140]">
                          <Scissors size={13} className="text-[#4A008B]" />
                          {apt.service_details?.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-[#4A008B]" />
                          {formatDateSafe(apt.timeslot_details?.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} className="text-[#4A008B]" />
                          {apt.timeslot_details?.start_time?.substring(0, 5)} hrs
                        </span>
                      </div>

                      {/* Especialista asignado y desglose de comisión */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => { setSelectedAppointment(apt); setShowAssignModal(true); }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3E8FF] text-[#4A008B] text-[11px] font-bold hover:bg-[#E5D0FF] transition-colors"
                          title="Cambiar o asignar especialista"
                        >
                          <UserCheck size={13} />
                          <span>
                            Atiende: {apt.worker_details ? `${apt.worker_details.first_name} ${apt.worker_details.last_name}` : 'Sin asignar'}
                            {apt.worker_details?.specialty_display ? ` (${apt.worker_details.specialty_display})` : ''}
                          </span>
                        </button>

                        {hasWorkerCommission && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-[#2C0140] text-[11px] font-semibold">
                            Comisión {Number(apt.commission_rate)}%: <strong>${Number(apt.worker_earnings).toLocaleString('es-CL')}</strong> • Negocio: <strong>${Number(apt.business_earnings).toLocaleString('es-CL')}</strong>
                          </span>
                        )}

                        {apt.status === 'completed' && hasWorkerCommission && (
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            apt.payout_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {apt.payout_status === 'paid' ? '💸 Pagado al especialista' : '⏳ Pago pendiente al especialista'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                    {apt.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAction(apt.id, 'confirm')}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200"
                        >
                          <CheckCircle size={15} /> Confirmar
                        </button>
                        <button 
                          onClick={() => handleAction(apt.id, 'cancel')}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-xs border border-red-200"
                        >
                          <XCircle size={15} /> Rechazar
                        </button>
                      </>
                    )}

                    {(apt.status === 'confirmed' || apt.status === 'rescheduled') && (
                      <button 
                        onClick={() => handleAction(apt.id, 'complete')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#4A008B] text-white rounded-xl font-bold text-xs shadow-sm"
                      >
                        <CheckCircle size={15} /> Finalizar Servicio
                      </button>
                    )}

                    {apt.status === 'completed' && hasWorkerCommission && apt.payout_status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(apt.id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        <DollarSign size={14} /> Pagar ${Number(apt.worker_earnings).toLocaleString('es-CL')}
                      </button>
                    )}

                    {!['completed', 'cancelled'].includes(apt.status) && (
                      <button 
                        onClick={() => openReschedule(apt)}
                        className="p-2 text-[#555555] hover:bg-gray-100 rounded-xl transition-colors"
                        title="Reagendar"
                      >
                        <RefreshCw size={17} />
                      </button>
                    )}

                    <a 
                      href={`https://wa.me/${(apt.client_details?.phone || '').replace(/\D/g, '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="WhatsApp Cliente"
                    >
                      <MessageCircle size={17} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal para Asignar o Cambiar Especialista */}
      {showAssignModal && selectedAppointment && (
        <div className="fixed inset-0 bg-[#2C0140]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#e6e6e6] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2C0140]">Asignar Especialista</h3>
                <p className="text-xs text-[#555555]">
                  Cita: {selectedAppointment.service_details?.name} ({selectedAppointment.client_details?.first_name})
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
              {specialists.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => handleAssignWorker(spec.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedAppointment.worker === spec.id
                      ? 'border-[#4A008B] bg-[#F3E8FF]/50'
                      : 'border-[#e6e6e6] hover:border-[#4A008B]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">{spec.full_name}</p>
                    <p className="text-xs text-[#4A008B] font-semibold">{spec.specialty_display}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#4A008B]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reagendamiento */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#e6e6e6] flex items-center justify-between bg-[#F3E8FF]/30">
              <h3 className="text-lg font-bold text-[#2C0140] font-tight">Reagendar Cita</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto">
              {availableSlots.length === 0 ? (
                <p className="text-center py-8 text-[#555555] text-xs italic">No hay otros horarios disponibles.</p>
              ) : (
                availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => handleReschedule(slot.id)}
                    className="w-full p-3.5 border border-[#e6e6e6] rounded-2xl flex items-center justify-between group hover:border-[#4A008B] hover:bg-[#F3E8FF]/20 transition-all"
                  >
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-[#4A008B] uppercase">
                        {slot.date} • {slot.provider_name || 'Especialista'}
                      </p>
                      <p className="text-sm text-[#2C0140] font-bold">
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)} hrs
                      </p>
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
