import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Scissors, Loader2, DollarSign, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from "../../api/axios" 

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  
  // Sincronizado con models.py: usamos 'duration' en lugar de 'duration_minutes'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '', 
    is_active: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('appointments/services/')
      setServices(response.data)
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validación de tipos de datos antes del envío
    const priceValue = parseFloat(formData.price)
    const durationValue = parseInt(formData.duration)

    if (isNaN(priceValue) || isNaN(durationValue)) {
      return toast.error('Precio y duración deben ser valores numéricos.')
    }

    // El payload ahora usa 'duration' para coincidir con el modelo Django
    const payload = {
      name: formData.name,
      description: formData.description,
      price: priceValue,
      duration: durationValue, 
      is_active: formData.is_active
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
        toast.success('Servicio creado exitosamente')
      }

      setShowModal(false)
      setEditingService(null)
      setFormData({ name: '', description: '', price: '', duration: '', is_active: true })
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
      console.error('Detalle error 400:', serverErrors)
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
      duration: service.duration, // Sincronizado con models.py
      is_active: service.is_active
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium tracking-tight">Sincronizando con base de datos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C0140]">Catálogo de Servicios</h1>
          <p className="text-[#555555] text-sm font-medium">Administración de la oferta Beaty Hogar</p>
        </div>
        
        <button
          onClick={() => {
            setEditingService(null)
            setFormData({ name: '', description: '', price: '', duration: '', is_active: true })
            setShowModal(true)
          }}
          className="px-6 py-2.5 bg-[#4A008B] text-white rounded-xl hover:bg-[#38006B] transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-purple-900/10"
        >
          <Plus className="w-5 h-5" />
          Añadir Servicio
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white p-6 rounded-2xl border border-[#e6e6e6] group hover:shadow-xl hover:border-[#4A008B] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center border border-[#4A008B]/10 transition-colors group-hover:bg-[#4A008B]">
                <Scissors className="w-6 h-6 text-[#4A008B] group-hover:text-white" />
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(service)} className="p-2 text-[#4A008B] hover:bg-[#F3E8FF] rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-[#2C0140] mb-2">{service.name}</h3>
            <p className="text-[#555555] text-xs mb-6 line-clamp-2 leading-relaxed">{service.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-[#e6e6e6]">
              <span className="text-xl font-bold text-[#4A008B]">${parseFloat(service.price).toLocaleString()}</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#555555] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#0AE8C6]" />
                {service.duration} min
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C0140]/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-[#e6e6e6] bg-[#F3E8FF]/30">
              <h3 className="text-xl font-bold text-[#2C0140]">{editingService ? 'Modificar' : 'Nuevo'} Servicio</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-[#2C0140]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl focus:ring-2 focus:ring-[#4A008B] outline-none text-sm"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-widest mb-1.5">Duración (min)</label>
                  <input
                    type="number"
                    value={formData.duration} 
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e6e6e6] rounded-xl outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 font-bold text-[#555555] hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#4A008B] text-white font-bold rounded-xl shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}