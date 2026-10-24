import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Users,
  Sparkles,
  Scissors,
  User
} from 'lucide-react'
import api, { getWebSocketUrl } from "../../api/axios"

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        api.get('appointments/dashboard/stats/'),
        api.get('appointments/')
      ])
      setStats(statsRes.data)
      setRecentAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data.slice(0, 5) : [])
    } catch (error) {
      console.error("Error cargando dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = new WebSocket(getWebSocketUrl(token))

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'appointment_update' || data.type === 'notification') {
        loadDashboardData()
      }
    }

    return () => socket.close()
  }, [loadDashboardData])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-[#0AE8C6]/15 text-[#07a68e] border-[#0AE8C6]/30',
      rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return colors[status] || colors.pending
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rescheduled: 'Reagendada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-10 h-10 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] text-xs font-medium">Sincronizando panel...</p>
      </div>
    )
  }

  const quickNav = [
    { label: 'Especialistas y Pagos', to: '/admin/specialists', icon: Users },
    { label: 'Citas', to: '/admin/appointments', icon: Calendar },
    { label: 'Horarios', to: '/admin/timeslots', icon: Clock },
    { label: 'Servicios', to: '/admin/services', icon: Scissors },
    { label: 'Clientes', to: '/admin/clients', icon: Users },
    { label: 'Mi Perfil', to: '/admin/profile', icon: User }
  ]

  return (
    <div className="space-y-6 font-sans pb-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles size={15} className="text-[#0AE8C6]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A008B]">Modo Profesional</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2C0140] font-tight">Panel de Control</h1>
        </div>
      </div>

      {/* Métricas en Cuadrícula 2x2 Móvil Nativa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Citas Totales', val: stats?.total_appointments || 0, icon: Calendar, color: 'from-[#4A008B] to-[#2C0140]' },
          { label: 'Ingresos', val: `$${parseFloat(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-[#0AE8C6] to-[#089e88] text-[#2C0140]' },
          { label: 'Por Confirmar', val: stats?.pending_appointments || 0, icon: AlertCircle, color: 'from-[#7B1FA2] to-[#4A008B]' },
          { label: 'Clientes', val: stats?.total_clients || 0, icon: Users, color: 'from-[#2C0140] to-[#4A008B]' }
        ].map((s, i) => (
          <div key={i} className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${s.color} text-white shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
              <div className="p-2 bg-white/15 rounded-xl">
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-tight truncate">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Accesos Rápidos de Gestión */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickNav.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e6e6e6] rounded-2xl text-xs font-bold text-[#2C0140] shrink-0 shadow-2xs active:scale-95 transition-transform"
            >
              <Icon size={15} className="text-[#4A008B]" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Últimos Movimientos en Tarjetas Amigables para Móvil */}
      <div className="bg-white rounded-3xl border border-[#e6e6e6] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#2C0140] font-tight">Últimos Movimientos</h2>
          <Link to="/admin/appointments" className="text-[#4A008B] font-bold text-xs flex items-center gap-1 hover:underline">
            Ver todas <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto" />
            <p className="text-[#555555] text-xs">Aún no registras actividad en tu agenda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAppointments.map((apt) => (
              <div key={apt.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] flex items-center justify-center text-[#4A008B] font-bold text-xs shrink-0">
                    {apt.client_details?.first_name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2C0140] text-sm truncate">
                      {apt.client_details?.first_name} {apt.client_details?.last_name}
                    </p>
                    <p className="text-xs text-[#555555] truncate">
                      {apt.service_details?.name} • {apt.timeslot_details?.date} ({apt.timeslot_details?.start_time?.substring(0, 5)})
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getStatusColor(apt.status)}`}>
                  {getStatusLabel(apt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
