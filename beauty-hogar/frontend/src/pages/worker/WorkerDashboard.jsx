import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  TrendingUp,
  Scissors,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Loader2,
  Sparkles,
  Percent,
  User,
  Layers,
  X
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  rescheduled: 'Reagendada',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-[#0AE8C6]/15 text-[#068874] border-[#0AE8C6]/40',
  rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200'
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const activeSection = location.pathname.includes('/services')
    ? 'services'
    : location.pathname.includes('/appointments')
    ? 'appointments'
    : location.pathname.includes('/timeslots')
    ? 'timeslots'
    : location.pathname.includes('/earnings')
    ? 'earnings'
    : 'overview'

  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [slots, setSlots] = useState([])
  const [myServices, setMyServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [aptFilter, setAptFilter] = useState('all')

  // Estado para gestionar los servicios y precios del propio especialista
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [savingService, setSavingService] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '60',
    is_active: true
  })

  // Estado para creación de horarios por días de trabajo del especialista
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [selectedWeekdays, setSelectedWeekdays] = useState([0, 1, 2, 3, 4]) // Lun a Vie por defecto
  const [slotForm, setSlotForm] = useState({
    date: todayStr,
    weeks: '2',
    start_time: '09:00',
    end_time: '18:00',
    interval: '60'
  })
  const [creatingSlots, setCreatingSlots] = useState(false)

  const fetchAllWorkerData = useCallback(async () => {
    try {
      const [statsRes, aptsRes, slotsRes, servicesRes] = await Promise.all([
        api.get('appointments/worker/stats/'),
        api.get('appointments/'),
        api.get('appointments/time-slots/'),
        api.get('appointments/services/?mine=1')
      ])
      setStats(statsRes.data)
      setAppointments(Array.isArray(aptsRes.data) ? aptsRes.data : [])
      setSlots(Array.isArray(slotsRes.data) ? slotsRes.data : [])
      const srvList = Array.isArray(servicesRes.data) ? servicesRes.data : []
      setMyServices(srvList)
      if (srvList.length > 0 && srvList[0].duration) {
        setSlotForm(prev => ({ ...prev, interval: String(srvList[0].duration) }))
      }
    } catch (error) {
      toast.error('No se pudo sincronizar tu panel de especialista')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllWorkerData()
    const handleRealtime = () => fetchAllWorkerData()
    window.addEventListener('beauty-realtime-update', handleRealtime)
    return () => window.removeEventListener('beauty-realtime-update', handleRealtime)
  }, [fetchAllWorkerData])

  const handleAppointmentAction = async (id, action) => {
    try {
      await api.post(`appointments/${id}/${action}/`)
      const labels = {
        confirm: 'Cita confirmada',
        complete: '¡Servicio completado! Tu comisión fue registrada',
        cancel: 'Cita cancelada'
      }
      toast.success(labels[action] || 'Cita actualizada')
      fetchAllWorkerData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar la cita')
    }
  }

  const toggleWeekday = (dayIdx) => {
    setSelectedWeekdays(prev =>
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort()
    )
  }

  const handleBulkCreateSlots = async (e) => {
    e.preventDefault()
    if (selectedWeekdays.length === 0) {
      return toast.error('Selecciona al menos un día de trabajo de la semana')
    }
    setCreatingSlots(true)
    try {
      const res = await api.post('appointments/time-slots/bulk-create/', {
        weekdays: selectedWeekdays,
        weeks: parseInt(slotForm.weeks || '2', 10),
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        interval: parseInt(slotForm.interval, 10)
      })
      toast.success(res.data.message || 'Tus días de trabajo y horarios fueron habilitados')
      fetchAllWorkerData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Revisa el rango de horas')
    } finally {
      setCreatingSlots(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    try {
      await api.delete(`appointments/time-slots/${slotId}/`)
      toast.success('Horario eliminado')
      setSlots(slots.filter(s => s.id !== slotId))
    } catch (error) {
      toast.error('No se pudo eliminar el horario')
    }
  }

  const openNewServiceModal = () => {
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      price: '',
      duration: '60',
      is_active: true
    })
    setShowServiceModal(true)
  }

  const openEditServiceModal = (service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration: String(service.duration || 60),
      is_active: service.is_active ?? true
    })
    setShowServiceModal(true)
  }

  const handleSaveService = async (e) => {
    e.preventDefault()
    if (!editingService) return
    const priceValue = parseFloat(serviceForm.price)
    const durationValue = parseInt(serviceForm.duration, 10)
    if (isNaN(priceValue) || priceValue <= 0 || isNaN(durationValue) || durationValue <= 0) {
      return toast.error('Ingresa un precio y duración válidos')
    }
    setSavingService(true)
    try {
      const payload = {
        description: serviceForm.description.trim(),
        price: priceValue,
        duration: durationValue
      }
      await api.patch(`appointments/services/${editingService.id}/`, payload)
      toast.success('¡Tu precio y duración de servicio fueron actualizados!')
      setSlotForm(prev => ({ ...prev, interval: String(durationValue) }))
      setShowServiceModal(false)
      fetchAllWorkerData()
    } catch (error) {
      toast.error('No se pudo actualizar el precio y duración')
    } finally {
      setSavingService(false)
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('¿Deseas eliminar este servicio de tu catálogo?')) return
    try {
      await api.delete(`appointments/services/${serviceId}/`)
      toast.success('Servicio eliminado')
      fetchAllWorkerData()
    } catch (error) {
      toast.error('No se puede eliminar un servicio que ya tiene citas registradas')
    }
  }

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'Pendiente'
    const d = new Date(`${dateStr}T00:00:00`)
    return isValid(d) ? format(d, "EEE d 'de' MMM", { locale: es }) : dateStr
  }

  const formatPaidDate = (isoStr) => {
    if (!isoStr) return ''
    try {
      const d = parseISO(isoStr)
      return isValid(d) ? format(d, "d MMM, HH:mm", { locale: es }) : ''
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 font-sans">
        <Loader2 className="w-9 h-9 text-[#4A008B] animate-spin" />
        <p className="text-xs font-bold text-[#555555] uppercase tracking-widest">
          Cargando tu espacio de especialista...
        </p>
      </div>
    )
  }

  const commissionRate = Number(stats?.commission_rate ?? user?.commission_rate ?? 60)
  const pendingPayout = Number(stats?.pending_payout ?? 0)
  const paidPayout = Number(stats?.paid_payout ?? 0)
  const expectedActive = Number(stats?.expected_active_earnings ?? 0)
  const activeAppointments = appointments.filter(a => ['pending', 'confirmed', 'rescheduled'].includes(a.status))
  const completedAppointments = appointments.filter(a => a.status === 'completed')

  const filteredAppointments = appointments.filter(a => {
    if (aptFilter === 'all') return true
    if (aptFilter === 'active') return ['pending', 'confirmed', 'rescheduled'].includes(a.status)
    return a.status === aptFilter
  })

  return (
    <div className="space-y-5 font-sans pb-8">
      {/* Banner Superior del Especialista */}
      <div className="bg-gradient-to-br from-[#2C0140] via-[#3A0066] to-[#4A008B] text-white p-5 rounded-3xl shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#0AE8C6] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles size={11} /> {stats?.specialty_display || user?.specialty_display || 'Especialista Beauty Hogar'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-tight leading-tight">
              ¡Hola, {user?.first_name}!
            </h1>
            <p className="text-purple-200 text-xs mt-0.5">
              Ganas el <strong className="text-[#0AE8C6]">{commissionRate}%</strong> de comisión por cada servicio completado
            </p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl px-3 py-2 text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-purple-200">Por Cobrar</p>
            <p className="text-lg font-bold text-[#0AE8C6] font-tight">
              ${pendingPayout.toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </div>

      {/*1. SECCIÓN RESUMEN */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* Tarjetas de Finanzas y Citas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Por Cobrar</span>
                <Wallet size={16} className="text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-700 font-tight">
                ${pendingPayout.toLocaleString('es-CL')}
              </p>
              <p className="text-[11px] text-[#555555]">Listo para liquidar</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Ya Pagado</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-emerald-700 font-tight">
                ${paidPayout.toLocaleString('es-CL')}
              </p>
              <p className="text-[11px] text-[#555555]">Recibido en total</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#ececec] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#4A008B] uppercase">En Agenda</span>
                <TrendingUp size={16} className="text-[#4A008B]" />
              </div>
              <p className="text-xl font-bold text-[#2C0140] font-tight">
                ${expectedActive.toLocaleString('es-CL')}
              </p>
              <p className="text-[11px] text-[#555555]">{activeAppointments.length} citas activas</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#ececec] shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#555555] uppercase">Completadas</span>
                <Scissors size={16} className="text-[#4A008B]" />
              </div>
              <p className="text-xl font-bold text-[#2C0140] font-tight">
                {stats?.completed_appointments || 0}
              </p>
              <p className="text-[11px] text-[#555555]">Servicios realizados</p>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate('/worker/services')}
              className="bg-white p-3.5 rounded-2xl border border-[#ececec] text-left flex flex-col gap-1.5 active:scale-95 transition-transform"
            >
              <Scissors size={18} className="text-[#4A008B]" />
              <span className="text-xs font-bold text-[#2C0140]">Mis Servicios</span>
              <span className="text-[10px] text-[#555555]">{myServices.length} publicados</span>
            </button>
            <button
              onClick={() => navigate('/worker/appointments')}
              className="bg-white p-3.5 rounded-2xl border border-[#ececec] text-left flex flex-col gap-1.5 active:scale-95 transition-transform"
            >
              <Calendar size={18} className="text-[#4A008B]" />
              <span className="text-xs font-bold text-[#2C0140]">Ver Citas</span>
              <span className="text-[10px] text-[#555555]">{activeAppointments.length} activas</span>
            </button>
            <button
              onClick={() => navigate('/worker/timeslots')}
              className="bg-white p-3.5 rounded-2xl border border-[#ececec] text-left flex flex-col gap-1.5 active:scale-95 transition-transform"
            >
              <Clock size={18} className="text-[#4A008B]" />
              <span className="text-xs font-bold text-[#2C0140]">Mis Horarios</span>
              <span className="text-[10px] text-[#555555]">{slots.filter(s => s.status === 'available').length} libres</span>
            </button>
            <button
              onClick={() => navigate('/worker/earnings')}
              className="bg-white p-3.5 rounded-2xl border border-[#ececec] text-left flex flex-col gap-1.5 active:scale-95 transition-transform"
            >
              <Wallet size={18} className="text-[#4A008B]" />
              <span className="text-xs font-bold text-[#2C0140]">Mis Pagos</span>
              <span className="text-[10px] text-[#555555]">Comisiones {commissionRate}%</span>
            </button>
          </div>

          {/* Próximas citas activas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2C0140] font-tight">
                Próximos Servicios por Atender
              </h2>
              <button
                onClick={() => navigate('/worker/appointments')}
                className="text-xs font-bold text-[#4A008B]"
              >
                Ver todos
              </button>
            </div>

            {activeAppointments.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl p-6 text-center">
                <p className="text-xs font-bold text-[#2C0140]">No tienes servicios pendientes por ahora</p>
                <p className="text-[11px] text-[#555555] mt-1">
                  Asegúrate de habilitar bloques disponibles en la pestaña "Horarios".
                </p>
              </div>
            ) : (
              activeAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-[#e6e6e6] p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${STATUS_STYLES[apt.status]}`}>
                        {STATUS_LABELS[apt.status]}
                      </span>
                      <h3 className="text-sm font-bold text-[#2C0140]">
                        {apt.service_details?.name}
                      </h3>
                      <p className="text-xs text-[#555555] flex items-center gap-1 mt-0.5">
                        <User size={12} className="text-[#4A008B]" />
                        Cliente: <strong>{apt.client_details?.first_name} {apt.client_details?.last_name}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#555555] uppercase">Tu Comisión ({Number(apt.commission_rate || commissionRate)}%)</p>
                      <p className="text-base font-bold text-[#4A008B] font-tight">
                        ${Number(apt.worker_earnings || (apt.total_price * commissionRate / 100)).toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-[#555555]">
                        Total cita: ${Number(apt.total_price).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#2C0140] bg-gray-50 p-2.5 rounded-xl">
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Calendar size={13} className="text-[#4A008B]" />
                      {formatDateSafe(apt.timeslot_details?.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} className="text-[#4A008B]" />
                      {apt.timeslot_details?.start_time?.substring(0, 5)} hrs
                    </span>
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-[#555555] bg-[#F3E8FF]/40 p-2.5 rounded-xl border border-purple-100">
                      <strong>Nota del cliente:</strong> {apt.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'confirm')}
                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={15} /> Confirmar
                      </button>
                    )}
                    {['confirmed', 'rescheduled'].includes(apt.status) && (
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'complete')}
                        className="flex-1 py-2.5 bg-[#4A008B] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={15} /> Finalizar Servicio
                      </button>
                    )}
                    <button
                      onClick={() => handleAppointmentAction(apt.id, 'cancel')}
                      className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
                    >
                      <XCircle size={15} />
                    </button>
                    {apt.client_details?.phone && (
                      <a
                        href={`https://wa.me/${apt.client_details.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN MIS CITAS */}
      {activeSection === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2C0140] font-tight">Mi Agenda de Citas</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'active', label: 'Por Atender' },
              { id: 'completed', label: 'Completadas' },
              { id: 'cancelled', label: 'Canceladas' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAptFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  aptFilter === tab.id
                    ? 'bg-[#4A008B] text-white shadow-xs'
                    : 'bg-white text-[#555555] border border-[#e6e6e6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl py-12 text-center text-xs text-[#555555]">
              No hay citas en esta categoría.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-[#e6e6e6] p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[apt.status]}`}>
                          {STATUS_LABELS[apt.status]}
                        </span>
                        {apt.status === 'completed' && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.payout_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {apt.payout_status === 'paid' ? (
                              <>
                                <CheckCircle2 size={11} /> Comisión Pagada
                              </>
                            ) : (
                              <>
                                <Clock size={11} /> Pago Pendiente
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#2C0140]">{apt.service_details?.name}</h3>
                      <p className="text-xs text-[#555555]">
                        Cliente: <strong>{apt.client_details?.first_name} {apt.client_details?.last_name}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#555555] uppercase">Mi ganancia ({Number(apt.commission_rate || commissionRate)}%)</p>
                      <p className="text-base font-bold text-[#4A008B]">
                        ${Number(apt.worker_earnings || (apt.total_price * commissionRate / 100)).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#2C0140] bg-gray-50 p-2.5 rounded-xl">
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Calendar size={13} className="text-[#4A008B]" />
                      {formatDateSafe(apt.timeslot_details?.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} className="text-[#4A008B]" />
                      {apt.timeslot_details?.start_time?.substring(0, 5)} hrs
                    </span>
                  </div>

                  {['pending', 'confirmed', 'rescheduled'].includes(apt.status) && (
                    <div className="flex items-center gap-2 pt-1">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'confirm')}
                          className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                        >
                          Confirmar Cita
                        </button>
                      )}
                      {['confirmed', 'rescheduled'].includes(apt.status) && (
                        <button
                          onClick={() => handleAppointmentAction(apt.id, 'complete')}
                          className="flex-1 py-2.5 bg-[#4A008B] text-white rounded-xl text-xs font-bold"
                        >
                          Finalizar Servicio
                        </button>
                      )}
                      {apt.client_details?.phone && (
                        <a
                          href={`https://wa.me/${apt.client_details.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SECCIÓN MIS DÍAS DE TRABAJO Y HORARIOS */}
      {activeSection === 'timeslots' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#e6e6e6] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2C0140]">Elegir Mis Días de Trabajo y Horarios</h2>
                <p className="text-xs text-[#555555]">
                  Marca los días de la semana que trabajas y tu jornada para generar tus bloques de atención
                </p>
              </div>
            </div>

            <form onSubmit={handleBulkCreateSlots} className="space-y-4">
              {/* Selector de Días de la Semana */}
              <div>
                <label className="block text-[11px] font-bold text-[#2C0140] uppercase tracking-wider mb-2">
                  1. ¿Qué días de la semana trabajas?
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { idx: 0, short: 'Lun', full: 'Lunes' },
                    { idx: 1, short: 'Mar', full: 'Martes' },
                    { idx: 2, short: 'Mié', full: 'Miércoles' },
                    { idx: 3, short: 'Jue', full: 'Jueves' },
                    { idx: 4, short: 'Vie', full: 'Viernes' },
                    { idx: 5, short: 'Sáb', full: 'Sábado' },
                    { idx: 6, short: 'Dom', full: 'Domingo' }
                  ].map((day) => {
                    const active = selectedWeekdays.includes(day.idx)
                    return (
                      <button
                        type="button"
                        key={day.idx}
                        onClick={() => toggleWeekday(day.idx)}
                        className={`py-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                          active
                            ? 'bg-[#4A008B] border-[#4A008B] text-white shadow-sm'
                            : 'bg-gray-50 border-[#e6e6e6] text-[#555555]'
                        }`}
                      >
                        <span className="text-xs font-bold">{day.short}</span>
                        <span className={`text-[9px] font-semibold ${active ? 'text-[#0AE8C6]' : 'text-gray-400'}`}>
                          {active ? 'Activo' : 'Libre'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Hora Término</label>
                  <input
                    type="time"
                    required
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Duración por cita</label>
                  <select
                    value={slotForm.interval}
                    onChange={(e) => setSlotForm({ ...slotForm, interval: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="30">Cada 30 min</option>
                    <option value="45">Cada 45 min</option>
                    <option value="60">Cada 60 min</option>
                    <option value="90">Cada 90 min</option>
                    <option value="120">Cada 120 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Abrir agenda por</label>
                  <select
                    value={slotForm.weeks}
                    onChange={(e) => setSlotForm({ ...slotForm, weeks: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="1">1 semana</option>
                    <option value="2">2 semanas</option>
                    <option value="4">4 semanas (1 mes)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingSlots}
                className="w-full py-3 bg-[#4A008B] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform"
              >
                {creatingSlots ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={15} /> Guardar Mis Días de Trabajo y Generar Horarios
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-[#2C0140]">Mis Bloques Configurados ({slots.length})</h3>
            {slots.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl py-10 text-center text-xs text-[#555555]">
                Aún no has creado horarios disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      slot.status === 'available'
                        ? 'bg-white border-[#e6e6e6]'
                        : 'bg-purple-50/50 border-purple-200'
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-bold text-[#4A008B] uppercase capitalize">
                        {formatDateSafe(slot.date)}
                      </p>
                      <p className="text-xs font-bold text-[#2C0140]">
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </p>
                      <span className={`text-[10px] font-bold ${
                        slot.status === 'available' ? 'text-emerald-600' : 'text-[#4A008B]'
                      }`}>
                        {slot.status === 'available' ? 'Disponible' : 'Reservado'}
                      </span>
                    </div>
                    {slot.status === 'available' && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SECCIÓN MIS PAGOS Y COMISIONES */}
      {activeSection === 'earnings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#e6e6e6] p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent size={18} className="text-[#4A008B]" />
                <h2 className="text-base font-bold text-[#2C0140]">Liquidación de Mis Comisiones</h2>
              </div>
              <span className="px-3 py-1 bg-[#F3E8FF] text-[#4A008B] rounded-full text-xs font-bold">
                Tu comisión: {commissionRate}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                <p className="text-[10px] font-bold text-amber-800 uppercase">Saldo Pendiente de Pago</p>
                <p className="text-xl font-bold text-amber-700 mt-0.5">
                  ${pendingPayout.toLocaleString('es-CL')}
                </p>
                <p className="text-[10px] text-amber-700/80 mt-0.5">
                  Por servicios completados
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Ya Pagado</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">
                  ${paidPayout.toLocaleString('es-CL')}
                </p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">
                  Liquidado por Administración
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#2C0140]">
            Historial de Servicios Completados ({completedAppointments.length})
          </h3>

          {completedAppointments.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcdcdc] rounded-2xl py-12 text-center text-xs text-[#555555]">
              Cuando finalices servicios aparecerá aquí el detalle de tu ganancia y el estado de pago.
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedAppointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl border border-[#e6e6e6] p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#2C0140] truncate">
                        {apt.service_details?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apt.payout_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.payout_status === 'paid' ? 'Pagado' : 'Pendiente de pago'}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555]">
                      Cliente: {apt.client_details?.first_name} • {formatDateSafe(apt.timeslot_details?.date)}
                    </p>
                    {apt.paid_at && (
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        Liquidado el {formatPaidDate(apt.paid_at)}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-[#4A008B]">
                      +${Number(apt.worker_earnings).toLocaleString('es-CL')}
                    </p>
                    <p className="text-[10px] text-[#555555]">
                      {Number(apt.commission_rate)}% de ${Number(apt.total_price).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. SECCIÓN MI SERVICIO: PRECIO Y DURACIÓN */}
      {activeSection === 'services' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#e6e6e6] p-4 sm:p-5 space-y-1 shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-[#2C0140] font-tight">
              Mi Servicio: Precio y Duración
            </h2>
            <p className="text-xs text-[#555555]">
              El Administrador habilita tu servicio en el catálogo y tú eliges <strong>cuánto cuesta ($)</strong> y <strong>cuánto demora (minutos)</strong>.
            </p>
          </div>

          {myServices.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcdcdc] rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center mx-auto">
                <Scissors size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2C0140]">El Administrador aún no te ha asignado un servicio</p>
                <p className="text-xs text-[#555555] mt-1 max-w-sm mx-auto">
                  Solicita al Administrador que habilite tu servicio en la sección de Especialistas o Catálogo.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myServices.map((srv) => {
                const priceNum = Number(srv.price || 0)
                const myCut = Math.round((priceNum * commissionRate) / 100)
                return (
                  <div
                    key={srv.id}
                    className="bg-white rounded-3xl border border-[#e6e6e6] p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center shrink-0">
                          <Scissors size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                srv.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {srv.is_active ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                              {srv.is_active
                                ? 'Habilitado por Admin en Catálogo'
                                : 'Pendiente que el Admin lo habilite'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#2C0140] leading-snug">{srv.name}</h3>
                          <p className="text-xs text-[#555555] mt-0.5">{srv.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-[#555555] uppercase">Costo de tu Servicio</p>
                        <p className="text-lg font-bold text-[#2C0140] font-tight">
                          ${priceNum.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#555555] uppercase">Cuánto Demora</p>
                        <p className="text-lg font-bold text-[#2C0140] font-tight flex items-center gap-1">
                          <Clock size={15} className="text-[#0AE8C6]" />
                          {srv.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#4A008B] uppercase">
                          Tu Comisión ({commissionRate}%)
                        </p>
                        <p className="text-lg font-bold text-[#4A008B] font-tight">
                          +${myCut.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditServiceModal(srv)}
                      className="w-full py-3 bg-[#4A008B] hover:bg-[#38006B] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform"
                    >
                      <Edit2 size={15} /> Configurar Cuánto Cuesta y Cuánto Demora
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para que el Especialista elija cuánto cuesta y cuánto demora su servicio */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-[#2C0140]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#e6e6e6]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors size={18} className="text-[#4A008B]" />
                <div>
                  <h2 className="text-base font-bold text-[#2C0140]">
                    Configurar Precio y Duración
                  </h2>
                  <p className="text-[11px] font-semibold text-[#4A008B]">{serviceForm.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C0140] mb-1.5">
                  1. ¿Cuánto va a costar tu servicio? ($ CLP)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="Ej: 18000"
                  className="input-field text-base font-bold text-[#2C0140]"
                />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {[12000, 15000, 18000, 22000, 25000, 30000].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setServiceForm({ ...serviceForm, price: String(preset) })}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        Number(serviceForm.price) === preset
                          ? 'bg-[#4A008B] text-white border-[#4A008B]'
                          : 'bg-gray-50 text-[#555555] border-gray-200'
                      }`}
                    >
                      ${preset.toLocaleString('es-CL')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C0140] mb-1.5">
                  2. ¿Cuánto demora tu servicio? (Minutos)
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setServiceForm({ ...serviceForm, duration: String(mins) })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        Number(serviceForm.duration) === mins
                          ? 'bg-[#4A008B] text-white border-[#4A008B]'
                          : 'bg-gray-50 text-[#2C0140] border-gray-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="15"
                  step="5"
                  required
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                  placeholder="60"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555555] mb-1">
                  Detalle de qué incluye tu atención
                </label>
                <textarea
                  rows={2}
                  required
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Ej: Incluye lavado, corte personalizado y secado a domicilio..."
                  className="input-field text-xs"
                />
              </div>

              {Number(serviceForm.price) > 0 && (
                <div className="bg-[#F3E8FF]/60 border border-purple-200 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C0140]">
                    Tu ganancia neta ({commissionRate}%):
                  </span>
                  <span className="text-base font-bold text-[#4A008B]">
                    ${Math.round((Number(serviceForm.price) * commissionRate) / 100).toLocaleString('es-CL')}
                  </span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#e6e6e6] text-xs font-bold text-[#555555]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="flex-1 py-3 rounded-xl bg-[#4A008B] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  {savingService ? <Loader2 size={15} className="animate-spin" /> : 'Guardar Precio y Duración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
