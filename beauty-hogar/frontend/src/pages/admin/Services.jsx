import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Scissors, Loader2, Clock, User, CheckCircle2, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/axios'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '15000',
    duration: '60',
    provider_id: '',
    is_active: true
  })

  useEffect(() => {
    fetchServices()
    const handleRealtime = () => fetchServices()
    window.addEventListener('beauty-realtime-update', handleRealtime)
    return () => window.removeEventListener('beauty-realtime-update', handleRealtime)
  }, [])

  const fetchServices = async () => {
    try {
      const [response, specRes] = await Promise.all([
        api.get('appointments/services/'),
        api.get('users/specialists/')
      ])
      setServices(Array.isArray(response.data) ? response.data : [])
      setSpecialists(Array.isArray(specRes.data) ? specRes.data : [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (service) => {
    setTogglingId(service.id)
    try {
      const nextState = !service.is_active
      await api.patch(`appointments/services/${service.id}/`, {
        is_active: nextState
      })
      toast.success(
        nextState
          ? `Servicio "${service.name}" habilitado en el catálogo de clientes.`
          : `Servicio "${service.name}" ocultado del catálogo.`
      )
      fetchServices()
    } catch (error) {
      toast.error('No se pudo actualizar el estado del servicio.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const priceValue = parseFloat(formData.price || 15000)
    const durationValue = parseInt(formData.duration || 60, 10)

    if (isNaN(priceValue) || isNaN(durationValue)) {
      return toast.error('Precio y duración deben ser valores numéricos.')
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: priceValue,
      duration: durationValue,
      is_active: formData.is_active
    }
    if (formData.provider_id) {
      payload.provider_id = parseInt(formData.provider_id, 10)
    }

    const path = editingService
      ? `appointments/services/${editingService.id}/`
      : 'appointments/services/'

    try {
      if (editingService) {
        await api.put(path, payload)
        toast.success('Servicio actualizado')
      } else {
        await api.post(path, payload)
        toast.success('Servicio habilitado exitosamente')
      }

      setShowModal(false)
      setEditingService(null)
      setFormData({ name: '', description: '', price: '15000', duration: '60', provider_id: '', is_active: true })
      fetchServices()
    } catch (error) {
      const serverErrors = error.response?.data
      if (serverErrors && typeof serverErrors === 'object') {
        const messages = Object.entries(serverErrors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ')
        toast.error(`Error de validación: ${messages}`)
      } else {
        toast.error('Error al procesar la solicitud.')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio del catálogo?')) return
    try {
      await api.delete(`appointments/services/${id}/`)
      toast.success('Servicio eliminado')
      fetchServices()
    } catch (error) {
      toast.error('No se puede eliminar un servicio que tiene citas asociadas.')
    }
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      provider_id: service.provider || '',
      is_active: service.is_active
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium tracking-tight">Sincronizando catálogo de servicios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140]">Catálogo y Habilitación de Servicios</h1>
          <p className="text-[#555555] text-xs sm:text-sm font-medium">
            Habilita los servicios de tus especialistas (ellos definen su precio y duración desde su panel)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null)
            setFormData({ name: '', description: '', price: '15000', duration: '60', provider_id: '', is_active: true })
            setShowModal(true)
          }}
          className="px-5 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] transition-all flex items-center justify-center gap-2 font-bold text-xs sm:text-sm shadow-lg shadow-purple-900/10"
        >
          <Plus className="w-4 h-4" />
          Habilitar Nuevo Servicio
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white p-5 rounded-3xl border transition-all flex flex-col justify-between ${
              service.is_active ? 'border-[#e6e6e6]' : 'border-amber-300 bg-amber-50/20'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 bg-[#F3E8FF] rounded-2xl flex items-center justify-center border border-[#4A008B]/10 shrink-0">
                    <Scissors className="w-5 h-5 text-[#4A008B]" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      service.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {service.is_active ? 'Habilitado' : 'Pendiente Habilitar'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-[#4A008B] hover:bg-[#F3E8FF] rounded-lg transition-colors"
                    title="Editar servicio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-[#2C0140] mb-1">{service.name}</h3>
              {service.provider_name && (
                <p className="text-xs font-bold text-[#4A008B] flex items-center gap-1 mb-2">
                  <User className="w-3.5 h-3.5" />
                  {service.provider_name} {service.provider_specialty ? `• ${service.provider_specialty}` : ''}
                </p>
              )}
              <p className="text-[#555555] text-xs mb-4 line-clamp-2 leading-relaxed">{service.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#e6e6e6]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-[#555555] uppercase font-bold">Precio Fijado</span>
                  <span className="text-lg font-bold text-[#4A008B]">
                    ${parseFloat(service.price).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-[#555555] uppercase font-bold">Duración</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2C0140]">
                    <Clock className="w-3.5 h-3.5 text-[#0AE8C6]" />
                    {service.duration} min
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleActive(service)}
                disabled={togglingId === service.id}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  service.is_active
                    ? 'bg-gray-100 hover:bg-gray-200 text-[#2C0140]'
                    : 'bg-[#4A008B] hover:bg-[#38006B] text-white shadow-sm'
                }`}
              >
                {togglingId === service.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : service.is_active ? (
                  <>
                    <EyeOff className="w-4 h-4 text-gray-500" />
                    Deshabilitar del Catálogo
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0AE8C6]" />
                    Habilitar Servicio para Clientes
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-[#e6e6e6] bg-[#F3E8FF]/30">
              <h3 className="text-base font-bold text-[#2C0140]">
                {editingService ? 'Modificar Servicio' : 'Habilitar Servicio a Especialista'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">
                  Especialista Asignado
                </label>
                <select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none text-sm bg-white"
                >
                  <option value="">Dirección / Administrador</option>
                  {specialists.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.full_name} — {spec.specialty_display}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">
                  Nombre del Servicio Habilitado
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Peluquería y Corte a Domicilio"
                  className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none text-sm"
                  rows={2}
                  required
                />
              </div>

              <div className="bg-[#F3E8FF]/50 border border-purple-200 rounded-2xl p-3 text-xs text-[#2C0140]">
                💡 <strong>Nota:</strong> El especialista podrá personalizar en su propio panel el <strong>precio ($)</strong> y <strong>cuánto demora (min)</strong> este servicio.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">
                    Precio Inicial ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">
                    Duración Inicial (min)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-[#2C0140] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#4A008B] rounded"
                />
                <span>Habilitar inmediatamente en el catálogo de clientes</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 font-bold text-[#555555] hover:bg-gray-100 rounded-xl transition-colors text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#4A008B] text-white font-bold rounded-xl shadow-lg text-xs"
                >
                  Guardar y Habilitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
