import { useState, useEffect } from 'react'
import { Search, User, Mail, Phone, Calendar, MessageCircle, Loader2, UserCheck } from 'lucide-react'
import api from "../../api/axios"

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await api.get('appointments/')
      const appointments = Array.isArray(response.data) ? response.data : []
      
      const uniqueClients = [
        ...new Map(
          appointments
            .filter(a => a.client_details)
            .map(a => [a.client_details.id, a.client_details])
        ).values()
      ]
      
      setClients(uniqueClients)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase()
    const firstName = (client?.first_name || '').toLowerCase()
    const lastName = (client?.last_name || '').toLowerCase()
    const email = (client?.email || '').toLowerCase()
    const phone = (client?.phone || '')

    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      email.includes(search) ||
      phone.includes(searchTerm)
    )
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-[#4A008B] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#0AE8C6] rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="text-[#555555] font-medium font-sans animate-pulse">Abriendo archivos de Beauty Hogar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header Estilizado */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-[#e6e6e6] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#4A008B] mb-1">
            <UserCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Panel Administrativo</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2C0140] font-tight">Directorio de Clientes</h1>
          <p className="text-[#555555] text-sm">Gestiona la base de datos de {clients.length} clientes registrados.</p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A008B]/40" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-[#e6e6e6] rounded-2xl focus:ring-2 focus:ring-[#4A008B] focus:bg-white outline-none text-sm transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Grid de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="bg-white text-center py-24 border-dashed border-2 border-[#e6e6e6] rounded-[2rem]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
            <User size={40} />
          </div>
          <h3 className="text-xl font-bold text-[#2C0140] font-tight">No hay coincidencias</h3>
          <p className="text-[#555555] text-sm max-w-xs mx-auto mt-2">No encontramos ningún cliente que coincida con "{searchTerm}".</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="flex flex-col h-full bg-white rounded-[2rem] border border-[#e6e6e6] overflow-hidden group hover:shadow-2xl hover:border-[#4A008B]/30 transition-all duration-500 transform hover:-translate-y-1"
            >
              {/* Parte Superior: Avatar y Nombre */}
              <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#4A008B] to-[#7B1FA2] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
                    <span className="text-xl font-bold text-white font-tight uppercase">
                      {(client.first_name?.[0] || 'U')}{(client.last_name?.[0] || '')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#2C0140] text-xl truncate font-tight leading-tight">
                      {client.first_name} {client.last_name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3E8FF] text-[#4A008B] uppercase tracking-tighter mt-1">
                      Cliente Verificado
                    </span>
                  </div>
                </div>

                {/* Info de Contacto */}
                <div className="space-y-4 text-sm text-[#555555]">
                  <div className="flex items-center gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover/item:bg-[#F3E8FF] transition-colors">
                      <Mail className="w-4 h-4 text-[#4A008B]" />
                    </div>
                    <span className="truncate font-medium">{client.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover/item:bg-[#F3E8FF] transition-colors">
                      <Phone className="w-4 h-4 text-[#4A008B]" />
                    </div>
                    <span className="font-bold text-[#2C0140]">{client.phone || 'Sin teléfono'}</span>
                  </div>
                </div>
              </div>

              {/* Pie de Tarjeta y Botón alineado al fondo */}
              <div className="mt-auto p-8 pt-4 space-y-6">
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[#555555]">
                    <Calendar className="w-4 h-4 text-[#0AE8C6]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Registro</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#2C0140]">
                    {client.date_joined ? new Date(client.date_joined).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <a
                  href={`https://wa.me/${(client.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#2C0140] text-white rounded-2xl font-bold text-sm hover:bg-[#4A008B] hover:shadow-xl hover:shadow-purple-200 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 text-[#0AE8C6]" />
                  Contactar Cliente
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}