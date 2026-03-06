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
  Sparkles
} from 'lucide-react'
import api from "../../api/axios"

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // Función de carga memorizada para poder llamarla desde el WebSocket
  const loadDashboardData = useCallback(async () => {
    try {
      // Ejecutamos ambas peticiones en paralelo para optimizar la carga
      const [statsRes, appointmentsRes] = await Promise.all([
        api.get('appointments/dashboard/stats/'),
        api.get('appointments/')
      ])
      setStats(statsRes.data)
      // Tomamos las 5 citas más recientes para el resumen visual
      setRecentAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data.slice(0, 5) : [])
    } catch (error) {
      console.error("Error cargando dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial
    loadDashboardData()

    // MEJORA: CONEXIÓN EN TIEMPO REAL
    // Mantiene las métricas sincronizadas con la actividad del servidor
    const socket = new WebSocket(`ws://localhost:8000/ws/appointments/`)

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'notification') {
        // Si hay una nueva reserva o cambio de estado, refrescamos todo el panel
        loadDashboardData()
      }
    }

    return () => socket.close()
  }, [loadDashboardData])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      confirmed: 'bg-[#0AE8C6]/10 text-[#07a68e] border-[#0AE8C6]/20',
      rescheduled: 'bg-blue-50 text-blue-700 border-blue-100',
      cancelled: 'bg-red-50 text-red-700 border-red-100',
      completed: 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return colors[status] || colors.pending
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium font-sans animate-pulse">Sincronizando Beauty Hogar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans pb-10 pt-4 px-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Sparkles size={18} className="text-[#0AE8C6]" />
             <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">Panel de Control</h1>
          </div>
          <p className="text-[#555555] text-sm font-medium">Métricas operativas actualizadas en vivo</p>
        </div>
      </div>

      {/* Métricas con Gradientes Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Citas Totales', val: stats?.total_appointments || 0, icon: Calendar, color: 'from-[#4A008B] to-[#2C0140]' },
          { label: 'Ingresos Brutos', val: `$${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-[#0AE8C6] to-[#4A008B]' },
          { label: 'Por Confirmar', val: stats?.pending_appointments || 0, icon: AlertCircle, color: 'from-[#7B1FA2] to-[#4A008B]' },
          { label: 'Clientes Base', val: stats?.total_clients || 0, icon: Users, color: 'from-[#2C0140] to-[#7B1FA2]' }
        ].map((s, i) => (
          <div key={i} className={`p-7 rounded-[2.5rem] bg-gradient-to-br ${s.color} text-white shadow-2xl shadow-purple-900/10 transition-transform hover:scale-[1.02] duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{s.label}</p>
                <p className="text-3xl font-bold font-tight">{s.val}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-[3rem] border border-[#e6e6e6] shadow-xl shadow-purple-900/5 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-[#2C0140] font-tight">Últimos Movimientos</h2>
          <Link to="/admin/appointments" className="text-[#4A008B] font-bold text-xs flex items-center gap-2 hover:bg-[#F3E8FF] px-4 py-2 rounded-xl transition-all">
            Ver Agenda Completa <ArrowUpRight size={14} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#555555] uppercase tracking-[0.2em]">
              <tr>
                <th className="py-5 px-10">Perfil Cliente</th>
                <th className="py-5 px-10">Servicio Seleccionado</th>
                <th className="py-5 px-10">Agenda</th>
                <th className="py-5 px-10 text-right">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#4A008B] font-bold text-sm">
                         {apt.client_details?.first_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[#2C0140] text-sm leading-none mb-1">
                          {apt.client_details?.first_name} {apt.client_details?.last_name}
                        </div>
                        <div className="text-[10px] font-medium text-[#555555]">{apt.client_details?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-10">
                    <div className="text-sm font-bold text-[#555555] group-hover:text-[#4A008B] transition-colors">
                      {apt.service_details?.name}
                    </div>
                  </td>
                  <td className="py-6 px-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2C0140]">
                      <Calendar size={12} className="text-[#0AE8C6]" />
                      {apt.timeslot_details?.date}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#555555] mt-1.5 uppercase tracking-tighter">
                      <Clock size={10} className="text-[#4A008B]" />
                      {apt.timeslot_details?.start_time.substring(0, 5)} hrs
                    </div>
                  </td>
                  <td className="py-6 px-10 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentAppointments.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="text-gray-200" />
              </div>
              <p className="text-[#555555] text-sm font-medium italic">Aún no registras actividad en tu agenda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}