import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentAppointments()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/dashboard/stats/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchRecentAppointments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setRecentAppointments(data)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rescheduled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu negocio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Total Citas</p>
              <p className="text-3xl font-bold">{stats?.total_appointments || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm mb-1">Pendientes</p>
              <p className="text-3xl font-bold">{stats?.pending_appointments || 0}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Confirmadas</p>
              <p className="text-3xl font-bold">{stats?.confirmed_appointments || 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Ingresos</p>
              <p className="text-3xl font-bold">${stats?.total_revenue?.toLocaleString() || 0}</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/appointments" className="card card-hover flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Gestionar Citas</h3>
            <p className="text-sm text-gray-600">Ver y administrar reservas</p>
          </div>
        </Link>

        <Link to="/admin/time-slots" className="card card-hover flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Horarios</h3>
            <p className="text-sm text-gray-600">Configurar disponibilidad</p>
          </div>
        </Link>

        <Link to="/admin/services" className="card card-hover flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Servicios</h3>
            <p className="text-sm text-gray-600">Administrar servicios</p>
          </div>
        </Link>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Citas Recientes</h2>
          <Link to="/admin/appointments" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todas
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Servicio</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fecha</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((apt) => (
                <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{apt.client.first_name} {apt.client.last_name}</div>
                    <div className="text-sm text-gray-500">{apt.client.email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{apt.service.name}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {apt.time_slot.date} {apt.time_slot.start_time.substring(0, 5)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}