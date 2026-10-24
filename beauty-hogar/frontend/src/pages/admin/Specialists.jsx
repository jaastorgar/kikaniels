import { useState, useEffect } from 'react'
import {
  UserPlus,
  Scissors,
  Percent,
  DollarSign,
  CheckCircle2,
  Edit3,
  Trash2,
  Phone,
  Mail,
  X,
  Loader2,
  Sparkles,
  Wallet,
  TrendingUp,
  Award,
  MessageCircle,
  Gem,
  Palette,
  HeartHandshake,
  Feather,
  Crown,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/axios'

const SPECIALTY_OPTIONS = [
  { value: 'peluquero', label: 'Peluquero / Estilista', icon: Scissors },
  { value: 'barbero', label: 'Barbero', icon: Award },
  { value: 'manicurista', label: 'Manicurista / Uñas', icon: Gem },
  { value: 'maquilladora', label: 'Maquillador(a)', icon: Palette },
  { value: 'cosmetologa', label: 'Cosmetóloga / Facial', icon: Sparkles },
  { value: 'masajista', label: 'Masajista / Spa', icon: HeartHandshake },
  { value: 'depilacion', label: 'Depilación', icon: Feather },
  { value: 'general', label: 'Especialista Integral', icon: Crown },
]

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  specialty: 'peluquero',
  commission_rate: '60',
  bio: '',
  is_active: true
}

export default function AdminSpecialists() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [togglingServiceId, setTogglingServiceId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingWorker, setEditingWorker] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [payoutModalService, setPayoutModalService] = useState(null)
  const [savingPayout, setSavingPayout] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    payout_type: 'fixed',
    worker_fixed_pay: '10000',
    worker_commission_rate: '60',
    is_active: true
  })

  useEffect(() => {
    fetchWorkers()
    const handleRealtime = () => fetchWorkers()
    window.addEventListener('beauty-realtime-update', handleRealtime)
    return () => window.removeEventListener('beauty-realtime-update', handleRealtime)
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await api.get('users/workers/')
      setWorkers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast.error('No se pudo cargar el equipo de especialistas')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingWorker(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEditModal = (worker) => {
    setEditingWorker(worker)
    setFormData({
      first_name: worker.first_name || '',
      last_name: worker.last_name || '',
      email: worker.email || '',
      phone: worker.phone || '',
      password: '',
      specialty: worker.specialty || 'general',
      commission_rate: String(worker.commission_rate ?? 60),
      bio: worker.bio || '',
      is_active: worker.is_active !== false
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialty: formData.specialty,
        commission_rate: parseFloat(formData.commission_rate || 60),
        bio: formData.bio.trim(),
        is_active: formData.is_active
      }

      if (formData.password.trim()) {
        payload.password = formData.password.trim()
      }

      if (editingWorker) {
        await api.patch(`users/workers/${editingWorker.id}/`, payload)
        toast.success('Especialista actualizado correctamente')
      } else {
        await api.post('users/workers/', payload)
        toast.success('¡Especialista contratado! Ya puede iniciar sesión con su correo y contraseña')
      }

      setShowModal(false)
      fetchWorkers()
    } catch (error) {
      const serverErrors = error.response?.data
      if (serverErrors && typeof serverErrors === 'object') {
        const firstMsg = Object.values(serverErrors).flat()[0]
        toast.error(firstMsg || 'Revisa los datos del especialista')
      } else {
        toast.error('Error al guardar el especialista')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePayAllPending = async (worker) => {
    if (!worker.pending_payout || worker.pending_payout <= 0) return
    if (!window.confirm(`¿Confirmas liquidar y marcar como pagado $${Number(worker.pending_payout).toLocaleString('es-CL')} para ${worker.first_name} ${worker.last_name}?`)) {
      return
    }

    setPayingId(worker.id)
    try {
      const res = await api.post(`users/workers/${worker.id}/pay-all/`)
      toast.success(res.data.message || 'Pago liquidado exitosamente')
      fetchWorkers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo liquidar el pago')
    } finally {
      setPayingId(null)
    }
  }

  const handleDeleteWorker = async (worker) => {
    if (!window.confirm(`¿Eliminar a ${worker.first_name} ${worker.last_name} del equipo?`)) return
    try {
      await api.delete(`users/workers/${worker.id}/`)
      toast.success('Especialista eliminado')
      fetchWorkers()
    } catch (error) {
      toast.error('No se pudo eliminar el especialista')
    }
  }

  const handleToggleWorkerService = async (service) => {
    setTogglingServiceId(service.id)
    try {
      const nextState = !service.is_active
      await api.patch(`appointments/services/${service.id}/`, {
        is_active: nextState
      })
      toast.success(
        nextState
          ? `¡Servicio "${service.name}" habilitado! Ya es visible para los clientes.`
          : `Servicio "${service.name}" pausado del catálogo.`
      )
      fetchWorkers()
    } catch (error) {
      toast.error('No se pudo cambiar el estado del servicio')
    } finally {
      setTogglingServiceId(null)
    }
  }

  const openPayoutModal = (service, worker) => {
    const srvPrice = Number(service.price || 15000)
    const defaultFixed = Number(service.worker_fixed_pay || 0) > 0
      ? Number(service.worker_fixed_pay)
      : Math.round((srvPrice * Number(service.worker_commission_rate || worker.commission_rate || 60)) / 100)

    setPayoutModalService({ ...service, workerName: `${worker.first_name} ${worker.last_name}`.trim() })
    setPayoutForm({
      payout_type: service.payout_type || 'percentage',
      worker_fixed_pay: String(defaultFixed),
      worker_commission_rate: String(Number(service.worker_commission_rate ?? worker.commission_rate ?? 60)),
      is_active: true
    })
  }

  const handleSaveServicePayout = async (e) => {
    e.preventDefault()
    if (!payoutModalService) return

    const srvPrice = Number(payoutModalService.price || 0)
    const fixedVal = parseFloat(payoutForm.worker_fixed_pay || 0)
    const rateVal = parseFloat(payoutForm.worker_commission_rate || 60)

    if (payoutForm.payout_type === 'fixed' && (isNaN(fixedVal) || fixedVal < 0 || fixedVal > srvPrice)) {
      toast.error(`El monto fijo debe estar entre $0 y $${srvPrice.toLocaleString('es-CL')}`)
      return
    }
    if (payoutForm.payout_type === 'percentage' && (isNaN(rateVal) || rateVal < 0 || rateVal > 100)) {
      toast.error('El porcentaje debe estar entre 0% y 100%')
      return
    }

    setSavingPayout(true)
    try {
      await api.patch(`appointments/services/${payoutModalService.id}/`, {
        payout_type: payoutForm.payout_type,
        worker_fixed_pay: payoutForm.payout_type === 'fixed' ? fixedVal : 0,
        worker_commission_rate: payoutForm.payout_type === 'percentage' ? rateVal : Number(payoutModalService.worker_commission_rate || 60),
        is_active: payoutForm.is_active
      })
      toast.success(
        payoutForm.is_active
          ? `Pago configurado y servicio "${payoutModalService.name}" habilitado (notificado al especialista)`
          : `Pago del servicio "${payoutModalService.name}" actualizado`
      )
      setPayoutModalService(null)
      fetchWorkers()
    } catch (error) {
      toast.error('No se pudo guardar el pago del servicio')
    } finally {
      setSavingPayout(false)
    }
  }

  const getSpecialtyMeta = (code) => {
    return SPECIALTY_OPTIONS.find(s => s.value === code) || { label: 'Especialista', icon: Sparkles }
  }

  const totals = workers.reduce(
    (acc, w) => {
      acc.pendingPayout += Number(w.pending_payout || 0)
      acc.paidPayout += Number(w.paid_payout || 0)
      acc.businessProfit += Number(w.business_profit || 0)
      acc.totalGenerated += Number(w.total_generated || 0)
      return acc
    },
    { pendingPayout: 0, paidPayout: 0, businessProfit: 0, totalGenerated: 0 }
  )

  const previewRate = Math.min(100, Math.max(0, parseFloat(formData.commission_rate || 0)))
  const businessRate = Math.max(0, 100 - previewRate)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
        <Loader2 className="w-9 h-9 text-[#4A008B] animate-spin" />
        <p className="text-xs font-bold text-[#555555] uppercase tracking-widest">
          Cargando equipo de especialistas...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 font-sans pb-8">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#2C0140] to-[#4A008B] text-white p-5 rounded-3xl shadow-md">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[#0AE8C6] text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles size={12} /> Equipo y Comisiones
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-tight leading-tight">
            Especialistas y Pagos
          </h1>
          <p className="text-purple-200 text-xs mt-0.5">
            Contrata peluqueros, barberos, manicuristas y gestiona sus pagos por porcentaje
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-3 bg-[#0AE8C6] text-[#2C0140] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform shrink-0"
        >
          <UserPlus size={17} />
          <span>Contratar Especialista</span>
        </button>
      </div>

      {/* Tarjetas de Resumen Financiero de Comisiones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#ececec] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#555555] uppercase">Equipo Activo</span>
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#2C0140] font-tight">
            {workers.filter(w => w.is_active).length}
          </p>
          <p className="text-[11px] text-[#555555] mt-0.5">Especialistas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Por Pagarles</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700 font-tight">
            ${totals.pendingPayout.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-[#555555] mt-0.5">Comisiones pendientes</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Ganancia Negocio</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700 font-tight">
            ${totals.businessProfit.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-[#555555] mt-0.5">Retención Beauty Hogar</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#ececec] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#555555] uppercase">Ya Liquidado</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-[#2C0140] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-xl font-bold text-[#2C0140] font-tight">
            ${totals.paidPayout.toLocaleString('es-CL')}
          </p>
          <p className="text-[11px] text-[#555555] mt-0.5">Pagado al equipo</p>
        </div>
      </div>

      {/* Lista de Especialistas */}
      {workers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#dcdcdc] rounded-3xl p-8 text-center">
          <div className="w-14 h-14 bg-[#F3E8FF] text-[#4A008B] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Scissors size={26} />
          </div>
          <h3 className="text-base font-bold text-[#2C0140]">Aún no has contratado especialistas</h3>
          <p className="text-xs text-[#555555] max-w-sm mx-auto mt-1 mb-4">
            Agrega a tu equipo (peluquero, barbero, manicurista, etc.), define qué porcentaje ganan por servicio y asignales citas.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-[#4A008B] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
          >
            <UserPlus size={15} /> Contratar Primer Especialista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map((worker) => {
            const spec = getSpecialtyMeta(worker.specialty)
            const SpecIcon = spec.icon || Scissors
            const wRate = Number(worker.commission_rate ?? 60)
            const bRate = Math.max(0, 100 - wRate)
            const pendingAmount = Number(worker.pending_payout || 0)

            return (
              <div
                key={worker.id}
                className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                  worker.is_active ? 'border-[#e6e6e6]' : 'border-gray-200 opacity-65'
                }`}
              >
                <div className="space-y-3">
                  {/* Encabezado del Especialista */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4A008B] to-[#2C0140] text-[#0AE8C6] flex items-center justify-center shrink-0 shadow-sm border border-white/10">
                        <SpecIcon size={21} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#2C0140] text-base leading-tight truncate">
                            {worker.first_name} {worker.last_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            worker.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {worker.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#4A008B] mt-0.5">
                          {worker.specialty_display || spec.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(worker)}
                        className="p-2 text-[#4A008B] bg-[#F3E8FF]/70 hover:bg-[#F3E8FF] rounded-xl transition-colors"
                        title="Editar especialista y comisión"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteWorker(worker)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar especialista"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de Reparto de Porcentaje */}
                  <div className="bg-[#F8F9FA] p-3 rounded-2xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#4A008B] flex items-center gap-1">
                        <Percent size={12} /> Comisión Especialista: {wRate}%
                      </span>
                      <span className="text-[#2C0140]">
                        Negocio: {bRate}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#4A008B] h-full"
                        style={{ width: `${wRate}%` }}
                      />
                      <div
                        className="bg-[#0AE8C6] h-full"
                        style={{ width: `${bRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Métricas de Citas y Ganancias */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-[#555555] uppercase">Servicios</p>
                      <p className="text-sm font-bold text-[#2C0140] mt-0.5">
                        {worker.completed_count || 0} listos
                      </p>
                      <p className="text-[10px] text-[#4A008B] font-semibold">
                        {worker.active_count || 0} en agenda
                      </p>
                    </div>

                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Por Pagarle</p>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">
                        ${pendingAmount.toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-amber-700/80">Pendiente</p>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">Para Negocio</p>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        ${Number(worker.business_profit || 0).toLocaleString('es-CL')}
                      </p>
                      <p className="text-[10px] text-emerald-700/80">Ganancia neta</p>
                    </div>
                  </div>

                  {/* Servicios del Especialista (Pago por Servicio y Habilitar / Deshabilitar por Admin) */}
                  {Array.isArray(worker.services) && worker.services.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-[#555555] uppercase tracking-wider">
                        Servicios de {worker.first_name} ({worker.services.length}) — Configura Pago Fijo ($) o % por cada servicio
                      </p>
                      {worker.services.map((srv) => {
                        const isFixed = srv.payout_type === 'fixed'
                        const workerPay = Number(srv.calculated_worker_pay || 0)
                        const bizProfit = Number(srv.calculated_business_profit || 0)
                        const srvRate = Number(srv.worker_commission_rate ?? worker.commission_rate ?? 60)
                        return (
                          <div
                            key={srv.id}
                            className={`p-3 rounded-2xl border space-y-2 ${
                              srv.is_active
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-[#2C0140] truncate">{srv.name}</span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    srv.is_active
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-200/80 text-amber-900'
                                  }`}>
                                    {srv.is_active ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                    {srv.is_active ? 'Habilitado' : 'Pendiente habilitar'}
                                  </span>
                                </div>
                                <p className="text-[11px] font-bold text-[#4A008B] mt-0.5">
                                  Precio Cliente: ${Number(srv.price || 0).toLocaleString('es-CL')} • {srv.duration} min
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleWorkerService(srv)}
                                disabled={togglingServiceId === srv.id}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all active:scale-95 ${
                                  srv.is_active
                                    ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                                    : 'bg-[#4A008B] text-white shadow-sm hover:bg-[#38006B]'
                                }`}
                              >
                                {togglingServiceId === srv.id
                                  ? '...'
                                  : srv.is_active
                                  ? 'Deshabilitar'
                                  : 'Habilitar'}
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-black/5">
                              <div className="text-[10px] font-bold flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-lg bg-[#2C0140] text-[#0AE8C6] inline-flex items-center gap-1">
                                  {isFixed ? <DollarSign size={10} /> : <Percent size={10} />}
                                  {isFixed
                                    ? `Pago Fijo: $${workerPay.toLocaleString('es-CL')}`
                                    : `Pago (${srvRate}%): $${workerPay.toLocaleString('es-CL')}`}
                                </span>
                                <span className="text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                                  Negocio: ${bizProfit.toLocaleString('es-CL')}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => openPayoutModal(srv, worker)}
                                className="px-2.5 py-1 rounded-lg bg-[#F3E8FF] hover:bg-purple-200 text-[#4A008B] text-[10px] font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
                              >
                                <Wallet size={11} />
                                Configurar Pago ($ / %)
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Datos de contacto */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#555555] pt-1">
                    <span className="inline-flex items-center gap-1 truncate">
                      <Mail size={13} className="text-[#4A008B]" /> {worker.email}
                    </span>
                    {worker.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} className="text-[#4A008B]" /> {worker.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de Acción y Liquidación */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {pendingAmount > 0 ? (
                    <button
                      onClick={() => handlePayAllPending(worker)}
                      disabled={payingId === worker.id}
                      className="flex-1 py-2.5 px-3 bg-[#4A008B] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      {payingId === worker.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <>
                          <DollarSign size={15} className="text-[#0AE8C6]" />
                          <span>Liquidar Pago (${pendingAmount.toLocaleString('es-CL')})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 py-2 px-3 bg-gray-50 text-[#555555] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Pagos al día (${Number(worker.paid_payout || 0).toLocaleString('es-CL')} pagados)</span>
                    </div>
                  )}

                  {worker.phone && (
                    <a
                      href={`https://wa.me/${worker.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={17} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para Contratar / Editar Especialista */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-[#ececec] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-[#2C0140] font-tight">
                  {editingWorker ? 'Editar Especialista' : 'Contratar Especialista'}
                </h2>
                <p className="text-xs text-[#555555]">
                  Configura su rol profesional y porcentaje de comisión por servicio
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Selección de Especialidad */}
              <div>
                <label className="block text-xs font-bold text-[#2C0140] uppercase tracking-wider mb-2">
                  Especialidad / Rol en el Equipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTY_OPTIONS.map((opt) => {
                    const selected = formData.specialty === opt.value
                    const OptIcon = opt.icon || Scissors
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, specialty: opt.value })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                          selected
                            ? 'border-[#4A008B] bg-[#F3E8FF] text-[#2C0140] shadow-xs'
                            : 'border-[#e6e6e6] bg-white text-[#555555]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selected ? 'bg-[#4A008B] text-[#0AE8C6]' : 'bg-gray-100 text-[#4A008B]'
                        }`}>
                          <OptIcon size={15} strokeWidth={1.75} />
                        </div>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Configuración de Porcentaje de Pago */}
              <div className="bg-[#F3E8FF]/40 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2C0140] uppercase tracking-wider flex items-center gap-1.5">
                    <Percent size={14} className="text-[#4A008B]" />
                    Porcentaje para el Especialista
                  </label>
                  <span className="text-lg font-bold text-[#4A008B]">{previewRate}%</span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={previewRate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  className="w-full accent-[#4A008B]"
                />

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#4A008B]">
                    Especialista recibe: {previewRate}% (ej: ${(15000 * previewRate / 100).toLocaleString('es-CL')} de $15.000)
                  </span>
                  <span className="text-[#2C0140]">
                    Negocio: {businessRate}%
                  </span>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#555555] mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Ej: Camila"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Ej: Soto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#555555] mb-1">Correo de Acceso</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field text-sm"
                    placeholder="especialista@beautyhogar.cl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field text-sm"
                    placeholder="+56912345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555555] mb-1">
                  {editingWorker ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña para su Cuenta de Especialista'}
                </label>
                <input
                  type="password"
                  required={!editingWorker}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field text-sm"
                  placeholder={editingWorker ? '••••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555555] mb-1">Presentación / Experiencia (opcional)</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Ej: Especialista en uñas acrílicas y manicure rusa a domicilio..."
                />
              </div>

              {editingWorker && (
                <label className="flex items-center gap-2.5 text-xs font-bold text-[#2C0140] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#4A008B] rounded"
                  />
                  <span>Especialista activo para recibir reservas</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-[#e6e6e6] rounded-xl font-bold text-xs text-[#555555]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#4A008B] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editingWorker ? 'Guardar Cambios' : 'Contratar Especialista')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Configurar Pago por Servicio (Monto Fijo $ o Porcentaje %) */}
      {payoutModalService && (() => {
        const srvPrice = Number(payoutModalService.price || 0)
        const isFixed = payoutForm.payout_type === 'fixed'
        const fixedPayVal = Math.min(srvPrice, Math.max(0, parseFloat(payoutForm.worker_fixed_pay || 0) || 0))
        const ratePayVal = Math.min(100, Math.max(0, parseFloat(payoutForm.worker_commission_rate || 0) || 0))
        const previewWorkerPay = isFixed ? fixedPayVal : Math.round((srvPrice * ratePayVal) / 100)
        const previewBizProfit = Math.max(0, srvPrice - previewWorkerPay)

        return (
          <div className="fixed inset-0 bg-[#2C0140]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#ececec] flex items-center justify-between bg-[#F3E8FF]/30">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A008B]">
                    Pago por Servicio • {payoutModalService.workerName}
                  </span>
                  <h2 className="text-base font-bold text-[#2C0140] font-tight mt-0.5">
                    {payoutModalService.name}
                  </h2>
                  <p className="text-xs font-semibold text-[#555555]">
                    Precio al cliente: ${srvPrice.toLocaleString('es-CL')} • {payoutModalService.duration} min
                  </p>
                </div>
                <button
                  onClick={() => setPayoutModalService(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSaveServicePayout} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C0140] uppercase tracking-wider mb-2">
                    Modalidad de Pago para este Servicio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, payout_type: 'fixed' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isFixed
                          ? 'border-[#4A008B] bg-[#F3E8FF] text-[#2C0140] shadow-xs'
                          : 'border-[#e6e6e6] bg-white text-[#555555]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <DollarSign size={15} className="text-[#4A008B]" />
                        <span>Monto Fijo ($)</span>
                      </div>
                      <p className="text-[10px] text-[#555555] mt-1">
                        Pago exacto en pesos por realizar este servicio
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, payout_type: 'percentage' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        !isFixed
                          ? 'border-[#4A008B] bg-[#F3E8FF] text-[#2C0140] shadow-xs'
                          : 'border-[#e6e6e6] bg-white text-[#555555]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Percent size={15} className="text-[#4A008B]" />
                        <span>Porcentaje (%)</span>
                      </div>
                      <p className="text-[10px] text-[#555555] mt-1">
                        Comisión porcentual sobre el valor del servicio
                      </p>
                    </button>
                  </div>
                </div>

                {isFixed ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#2C0140]">
                      Monto Fijo a Pagar al Especialista ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={srvPrice}
                      step="500"
                      required
                      value={payoutForm.worker_fixed_pay}
                      onChange={(e) => setPayoutForm({ ...payoutForm, worker_fixed_pay: e.target.value })}
                      className="input-field text-sm font-bold"
                      placeholder="Ej: 10000"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0.5, 0.6, 0.7, 0.8].map((ratio) => {
                        const suggested = Math.round((srvPrice * ratio) / 500) * 500
                        return (
                          <button
                            type="button"
                            key={ratio}
                            onClick={() => setPayoutForm({ ...payoutForm, worker_fixed_pay: String(suggested) })}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#F3E8FF] text-[#2C0140] text-[10px] font-bold"
                          >
                            ${suggested.toLocaleString('es-CL')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#2C0140]">
                        Porcentaje para este Servicio (%)
                      </label>
                      <span className="text-base font-bold text-[#4A008B]">{ratePayVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={ratePayVal}
                      onChange={(e) => setPayoutForm({ ...payoutForm, worker_commission_rate: e.target.value })}
                      className="w-full accent-[#4A008B]"
                    />
                  </div>
                )}

                {/* Resumen de Reparto por este Servicio */}
                <div className="bg-[#2C0140] text-white p-3.5 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-200">Precio cobrado al cliente:</span>
                    <span className="font-bold">${srvPrice.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#0AE8C6] font-bold">
                      Pago al Especialista ({isFixed ? 'Monto Fijo' : `${ratePayVal}%`}):
                    </span>
                    <span className="font-bold text-[#0AE8C6] text-sm">
                      ${previewWorkerPay.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-purple-200">Ganancia Beauty Hogar:</span>
                    <span className="font-bold text-white">${previewBizProfit.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-bold text-[#2C0140] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payoutForm.is_active}
                    onChange={(e) => setPayoutForm({ ...payoutForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#4A008B] rounded"
                  />
                  <span>Dejar servicio habilitado en el catálogo de clientes</span>
                </label>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPayoutModalService(null)}
                    className="flex-1 py-2.5 border border-[#e6e6e6] rounded-xl font-bold text-xs text-[#555555]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayout}
                    className="flex-1 py-2.5 bg-[#4A008B] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {savingPayout ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={15} className="text-[#0AE8C6]" />
                        <span>Guardar Pago</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
