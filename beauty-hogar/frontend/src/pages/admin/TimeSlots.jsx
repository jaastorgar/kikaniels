import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Clock, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner' // Asegúrate de tener sonner o cambia a tu sistema de avisos
import api from "../../api/axios"

export default function AdminTimeSlots() {
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: ''
  })
  const [bulkData, setBulkData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    interval: 60 // Coincide con el backend 'interval'
  })

  useEffect(() => {
    fetchTimeSlots()
  }, [])

  const fetchTimeSlots = async () => {
    try {
      /* CORRECCIÓN: Eliminamos el '/api' del inicio. 
         Axios inyecta automáticamente el prefijo configurado. 
      */
      const response = await api.get('appointments/time-slots/')
      setTimeSlots(response.data)
    } catch (error) {
      console.error('Error al cargar horarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // CORRECCIÓN: Ruta limpia
      await api.post('appointments/time-slots/', formData)
      setShowModal(false)
      setFormData({ date: '', start_time: '', end_time: '' })
      toast.success('Horario creado exitosamente')
      fetchTimeSlots()
    } catch (error) {
      toast.error('Error al crear el horario')
    }
  }

  const handleBulkCreate = async (e) => {
    e.preventDefault()
    try {
      // CORRECCIÓN: Ruta limpia
      await api.post('appointments/time-slots/bulk-create/', bulkData)
      setShowBulkModal(false)
      setBulkData({ date: '', start_time: '', end_time: '', interval: 60 })
      toast.success('Horarios generados exitosamente')
      fetchTimeSlots()
    } catch (error) {
      toast.error('Error en la creación masiva')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return
    
    try {
      // CORRECCIÓN: Ruta limpia
      await api.delete(`appointments/time-slots/${id}/`)
      toast.success('Horario eliminado')
      fetchTimeSlots()
    } catch (error) {
      toast.error('No se puede eliminar un horario con citas asociadas')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-50 text-green-700 border-green-200',
      occupied: 'bg-red-50 text-red-700 border-red-200',
      blocked: 'bg-gray-100 text-gray-500 border-gray-200'
    }
    return colors[status] || colors.available
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium">Sincronizando disponibilidad...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140]">Gestión de Horarios</h1>
          <p className="text-[#555555] text-sm">Configura los bloques de atención para el equipo</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-white border border-[#0AE8C6] text-[#2C0140] rounded-xl hover:bg-[#0AE8C6]/10 transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-[#0AE8C6]" />
            Crear Múltiples
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] transition-all flex items-center gap-2 font-bold text-sm shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Horario
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F3E8FF]/50 border-b border-[#e6e6e6]">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-[#4A008B] uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-[#4A008B] uppercase tracking-wider">Hora Inicio</th>
                <th className="py-4 px-6 text-xs font-bold text-[#4A008B] uppercase tracking-wider">Hora Fin</th>
                <th className="py-4 px-6 text-xs font-bold text-[#4A008B] uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-bold text-[#4A008B] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e6e6]">
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#2C0140]">{slot.date}</td>
                  <td className="py-4 px-6 text-[#555555] flex items-center gap-2">
                    <Clock size={14} className="text-[#4A008B]" />
                    {slot.start_time.substring(0, 5)}
                  </td>
                  <td className="py-4 px-6 text-[#555555]">{slot.end_time.substring(0, 5)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(slot.status)}`}>
                      {slot.status === 'available' ? 'Disponible' : 
                       slot.status === 'occupied' ? 'Ocupado' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30"
                      disabled={slot.status === 'occupied'}
                      title={slot.status === 'occupied' ? "No se puede eliminar un horario ocupado" : "Eliminar"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {timeSlots.length === 0 && (
            <div className="py-12 text-center text-[#555555] text-sm italic">
              No hay horarios configurados para los próximos días.
            </div>
          )}
        </div>
      </div>

      {/* Modal Individual */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#e6e6e6] bg-[#F3E8FF]">
              <h3 className="text-xl font-bold text-[#2C0140]">Nuevo Horario</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A008B]" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Inicio</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Fin</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#e6e6e6]">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 font-bold text-[#555555] hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#4A008B] text-white font-bold rounded-xl shadow-lg hover:bg-[#38006B] transition-colors">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Masivo */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#e6e6e6] bg-[#0AE8C6]/10">
              <h3 className="text-xl font-bold text-[#2C0140]">Creación Masiva</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleBulkCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={bulkData.date}
                  onChange={(e) => setBulkData({ ...bulkData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Inicio Jornada</label>
                  <input
                    type="time"
                    value={bulkData.start_time}
                    onChange={(e) => setBulkData({ ...bulkData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Fin Jornada</label>
                  <input
                    type="time"
                    value={bulkData.end_time}
                    onChange={(e) => setBulkData({ ...bulkData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1.5">Intervalo</label>
                <select
                  value={bulkData.interval}
                  onChange={(e) => setBulkData({ ...bulkData, interval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-[#e6e6e6] rounded-xl outline-none font-bold text-[#4A008B]"
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora (Estándar)</option>
                  <option value={90}>1 hora 30 min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#e6e6e6]">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-2 font-bold text-[#555555] hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-[#0AE8C6] text-[#2C0140] font-bold rounded-xl shadow-lg hover:bg-[#08D1B3] transition-colors">Generar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}