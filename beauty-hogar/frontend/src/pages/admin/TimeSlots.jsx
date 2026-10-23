import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Clock, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
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
    interval: 60
  })

  useEffect(() => {
    fetchTimeSlots()
  }, [])

  const fetchTimeSlots = async () => {
    try {
      const response = await api.get('appointments/time-slots/')
      setTimeSlots(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error al cargar horarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('appointments/time-slots/', formData)
      setShowModal(false)
      setFormData({ date: '', start_time: '', end_time: '' })
      toast.success('Horario creado exitosamente')
      fetchTimeSlots()
    } catch (error) {
      const msg = error.response?.data
        ? Object.values(error.response.data).flat().join(' ')
        : 'Error al crear el horario'
      toast.error(msg)
    }
  }

  const handleBulkCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('appointments/time-slots/bulk-create/', bulkData)
      setShowBulkModal(false)
      setBulkData({ date: '', start_time: '', end_time: '', interval: 60 })
      toast.success('Horarios generados exitosamente')
      fetchTimeSlots()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error en la creación masiva')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return
    
    try {
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

  const getStatusLabel = (status) => {
    if (status === 'available') return 'Disponible'
    if (status === 'occupied') return 'Ocupado'
    return 'Bloqueado'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-10 h-10 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] text-xs font-medium">Sincronizando disponibilidad...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140]">Gestión de Horarios</h1>
          <p className="text-[#555555] text-xs">Configura tus bloques de atención</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-white border border-[#0AE8C6] text-[#2C0140] rounded-xl hover:bg-[#0AE8C6]/10 transition-all flex items-center gap-1.5 font-bold text-xs shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#0AE8C6]" />
            Crear Múltiples
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] transition-all flex items-center gap-1.5 font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nuevo Horario
          </button>
        </div>
      </div>

      {/* Vista de Tarjetas Amigable para Móviles y Escritorio */}
      {timeSlots.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e6e6e6] rounded-3xl py-14 text-center text-[#555555] text-xs">
          No hay horarios configurados. Usa "Crear Múltiples" o "Nuevo Horario".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white border border-[#e6e6e6] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#4A008B]" />
                  <span className="font-bold text-sm text-[#2C0140]">{slot.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#555555] font-medium">
                  <Clock size={13} className="text-[#0AE8C6]" />
                  <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)} hrs</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(slot.status)}`}>
                  {getStatusLabel(slot.status)}
                </span>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30"
                  disabled={slot.status === 'occupied'}
                  title={slot.status === 'occupied' ? "Horario ocupado" : "Eliminar"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Individual */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#e6e6e6] bg-[#F3E8FF]/50">
              <h3 className="text-lg font-bold text-[#2C0140]">Nuevo Horario</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Inicio</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Fin</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e6e6e6]">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 font-bold text-sm text-[#555555] hover:bg-gray-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#4A008B] text-white font-bold text-sm rounded-xl shadow-md">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Masivo */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#e6e6e6] bg-[#0AE8C6]/15">
              <h3 className="text-lg font-bold text-[#2C0140]">Creación Masiva</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white rounded-full">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleBulkCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={bulkData.date}
                  onChange={(e) => setBulkData({ ...bulkData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Inicio Jornada</label>
                  <input
                    type="time"
                    value={bulkData.start_time}
                    onChange={(e) => setBulkData({ ...bulkData, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Fin Jornada</label>
                  <input
                    type="time"
                    value={bulkData.end_time}
                    onChange={(e) => setBulkData({ ...bulkData, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555555] uppercase mb-1">Intervalo</label>
                <select
                  value={bulkData.interval}
                  onChange={(e) => setBulkData({ ...bulkData, interval: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-[#e6e6e6] rounded-xl outline-none font-bold text-sm text-[#4A008B]"
                >
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora (Estándar)</option>
                  <option value={90}>1 hora 30 min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#e6e6e6]">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-2.5 font-bold text-sm text-[#555555] hover:bg-gray-100 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-[#0AE8C6] text-[#2C0140] font-bold text-sm rounded-xl shadow-md">
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
