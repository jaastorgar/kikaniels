import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Clock, ArrowRight, Loader2, Sparkles, User, Star } from 'lucide-react'
import api from '../api/axios'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      // Obtenemos los servicios activos desde la API
      const response = await api.get('appointments/services/')
      const activeServices = Array.isArray(response.data) 
        ? response.data.filter(s => s.is_active) 
        : []
      setServices(activeServices)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
        <p className="text-[#555555] font-medium font-sans animate-pulse">
          Preparando tu experiencia de belleza...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-24 font-sans max-w-7xl mx-auto px-4">
      {/* Header Estilizado */}
      <div className="text-center max-w-3xl mx-auto space-y-6 pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3E8FF] rounded-full text-[#4A008B] text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm">
          <Sparkles size={14} className="animate-pulse" /> Nuestra Selección
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2C0140] font-tight tracking-tight leading-none">
          Especialistas en tu <span className="text-[#4A008B]">Bienestar</span>
        </h1>
        <p className="text-[#555555] text-lg max-w-2xl mx-auto font-medium">
          Descubre servicios premium diseñados para renovar tu imagen y energía en la comodidad de tu hogar.
        </p>
      </div>

      {/* Grid de Servicios con Multi-tenancy */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div 
            key={service.id} 
            className="flex flex-col h-full bg-white rounded-[2.5rem] border border-[#e6e6e6] group hover:shadow-2xl hover:border-[#4A008B]/20 transition-all duration-500 overflow-hidden"
          >
            {/* Imagen/Icono de Cabecera */}
            <div className="h-48 bg-gradient-to-br from-[#F3E8FF]/50 to-white flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-[#e6e6e6]/50">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-[#2C0140] uppercase tracking-widest">Premium</span>
              </div>
              <Scissors size={56} className="text-[#4A008B]/10 group-hover:scale-110 group-hover:text-[#4A008B]/30 transition-all duration-700" />
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="text-2xl font-bold text-[#2C0140] font-tight tracking-tight group-hover:text-[#4A008B] transition-colors leading-tight">
                  {service.name}
                </h3>
                <span className="text-xl font-bold text-[#4A008B] font-tight whitespace-nowrap">
                  ${parseFloat(service.price).toLocaleString()}
                </span>
              </div>
              
              <p className="text-[#555555] text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                {service.description}
              </p>

              {/* Información de la Profesional (Multi-admin) */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-[#0AE8C6] font-bold text-[10px] uppercase tracking-[0.1em]">
                  <Clock size={14} />
                  <span>Duración: {service.duration} Minutos</span>
                </div>
                <div className="flex items-center gap-2 text-[#4A008B] font-bold text-[10px] uppercase tracking-[0.1em] bg-[#F3E8FF]/40 px-3 py-2 rounded-xl border border-[#4A008B]/5">
                  <User size={14} />
                  {/* Mostramos el correo o nombre del profesional dueño del servicio */}
                  <span>Profesional: {service.provider_email ? service.provider_email.split('@')[0] : 'Beauty Pro'}</span>
                </div>
              </div>

              {/* Botón de Acción Alineado al Fondo (Fix del botón corrido) */}
              <div className="mt-auto">
                <Link
                  to={`/book/${service.id}`}
                  className="w-full flex items-center justify-center gap-3 bg-[#2C0140] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-purple-900/5 hover:bg-[#4A008B] hover:shadow-purple-200 transition-all active:scale-[0.98] group/btn"
                >
                  Reservar Ahora
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}