import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Clock, ArrowRight, Loader2, Sparkles, User, Search } from 'lucide-react'
import api from '../api/axios'

export default function Services() {
  const [services, setServices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await api.get('appointments/services/')
      const activeServices = Array.isArray(response.data) 
        ? response.data.filter(s => s.is_active) 
        : []
      setServices(activeServices)
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-10 h-10 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] text-xs font-medium">Cargando catálogo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10 font-sans">
      {/* Cabecera Compacta de App */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[#4A008B] text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={12} className="text-[#0AE8C6]" /> Catálogo Beauty Hogar
          </div>
          <h1 className="text-2xl font-bold text-[#2C0140] font-tight leading-none">
            Nuestros Servicios
          </h1>
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tratamiento..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e6e6e6] rounded-2xl text-sm outline-none focus:border-[#4A008B]"
          />
        </div>
      </div>

      {/* Lista de Tarjetas Amigables para Móvil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((service) => (
          <div 
            key={service.id} 
            className="flex flex-col bg-white rounded-3xl border border-[#e6e6e6] p-5 shadow-2xs hover:border-[#4A008B]/30 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center shrink-0">
                  <Scissors size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C0140] font-tight leading-snug">
                    {service.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#555555] font-medium">
                    <User size={12} className="text-[#4A008B]" />
                    {service.provider_email ? service.provider_email.split('@')[0] : 'Beauty Pro'}
                  </span>
                </div>
              </div>

              <span className="text-lg font-bold text-[#4A008B] font-tight whitespace-nowrap">
                ${parseFloat(service.price).toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed mb-4 line-clamp-2">
              {service.description}
            </p>

            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C0140]">
                <Clock size={14} className="text-[#0AE8C6]" />
                {service.duration} min
              </span>

              <Link
                to={`/book/${service.id}`}
                className="inline-flex items-center gap-1.5 bg-[#2C0140] hover:bg-[#4A008B] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                Reservar
                <ArrowRight size={14} className="text-[#0AE8C6]" />
              </Link>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-[#e6e6e6] py-14 text-center">
            <p className="text-sm font-bold text-[#2C0140]">No se encontraron servicios</p>
            <p className="text-xs text-[#555555] mt-1">Prueba con otro término de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
