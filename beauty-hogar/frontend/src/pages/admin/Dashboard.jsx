import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Loader2,
  Users
} from 'lucide-react'
import api from "../../api/axios"

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Ejecutamos ambas peticiones en paralelo para mayor velocidad
        const [statsRes, appointmentsRes] = await Promise.all([
          api.get('appointments/dashboard/stats/'),
          api.get('appointments/')
        ])
        setStats(statsRes.data)
        // Tomamos solo las 5 citas más recientes para el resumen
        setRecentAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data.slice(0, 5) : [])
      } catch (error) {
        console.error("Error cargando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      confirmed: 'bg-green-50 text-green-700 border-green-100',
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
        <p className="text-[#555555] font-medium font-sans">Abriendo panel de Beauty Hogar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight">Panel de Control</h1>
          <p className="text-[#555555] text-sm">Resumen operativo y métricas en tiempo real</p>
        </div>
      </div>

      {/* Métricas con Colores Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Citas Totales', val: stats?.total_appointments || 0, icon: Calendar, color: 'from-[#4A008B] to-[#2C0140]' },
          { label: 'Ingresos', val: `$${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-[#0AE8C6] to-[#4A008B]' },
          { label: 'Pendientes', val: stats?.pending_appointments || 0, icon: AlertCircle, color: 'from-orange-400 to-red-500' },
          { label: 'Clientes', val: stats?.total_clients || 0, icon: Users, color: 'from-[#7B1FA2] to-[#4A008B]' }
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-[2rem] bg-gradient-to-br ${s.color} text-white shadow-xl shadow-purple-900/10`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-3xl font-bold font-tight">{s.val}</p>
              </div>
              <s.icon className="w-8 h-8 opacity-30" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Actividad Reciente */}
      <div className="bg-white rounded-[2.5rem] border border-[#e6e6e6] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2C0140] font-tight">Citas Recientes</h2>
          <Link to="/admin/appointments" className="text-[#4A008B] font-bold text-xs flex items-center gap-1 hover:underline">
            Ver todas <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#555555] uppercase tracking-widest">
              <tr>
                <th className="py-4 px-8">Cliente</th>
                <th className="py-4 px-8">Servicio</th>
                <th className="py-4 px-8">Fecha y Hora</th>
                <th className="py-4 px-8 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-8">
                    <div className="font-bold text-[#2C0140] text-sm leading-tight">
                      {apt.client_details?.first_name} {apt.client_details?.last_name}
                    </div>
                    <div className="text-[10px] text-[#555555] mt-0.5">{apt.client_details?.email}</div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="text-sm font-medium text-[#555555]">{apt.service_details?.name}</div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2C0140]">
                      <Calendar size={12} className="text-[#4A008B]" />
                      {apt.timeslot_details?.date}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#555555] mt-1">
                      <Clock size={10} />
                      {apt.timeslot_details?.start_time.substring(0, 5)} hrs
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentAppointments.length === 0 && (
            <div className="py-12 text-center text-[#555555] text-sm font-medium italic">
              Aún no hay citas registradas en el sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}