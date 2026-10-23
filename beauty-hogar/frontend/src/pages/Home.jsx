import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Scissors, 
  Clock, 
  Sparkles, 
  ArrowRight,
  User,
  PlusCircle,
  CheckCircle2,
  MapPin
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

const STATUS_LABELS = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  rescheduled: 'Reagendada'
}

export default function Home() {
  const { user, isAdmin } = useAuth()
  const [services, setServices] = useState([])
  const [nextAppointment, setNextAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [srvRes, aptRes] = await Promise.all([
          api.get('appointments/services/'),
          api.get('appointments/')
        ])
        const activeServices = Array.isArray(srvRes.data)
          ? srvRes.data.filter(s => s.is_active).slice(0, 4)
          : []
        setServices(activeServices)

        const aptList = Array.isArray(aptRes.data) ? aptRes.data : []
        const upcoming = aptList.find(a => ['pending', 'confirmed', 'rescheduled'].includes(a.status))
        setNextAppointment(upcoming || null)
      } catch (e) {
        // Silencioso en carga inicial
      } finally {
        setLoading(false)
      }
    }
    loadHomeData()
  }, [])

  const formatDateShort = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = parseISO(dateStr)
      return isValid(d) ? format(d, "EEE d 'de' MMM", { locale: es }) : dateStr
    } catch {
      return dateStr
    }
  }

  const quickActions = [
    { label: 'Reservar', icon: PlusCircle, to: '/book', color: 'bg-[#4A008B] text-white' },
    { label: 'Servicios', icon: Scissors, to: '/services', color: 'bg-[#F3E8FF] text-[#4A008B]' },
    { label: 'Mis Citas', icon: Calendar, to: '/my-appointments', color: 'bg-[#0AE8C6]/15 text-[#2C0140]' },
    { label: 'Mi Perfil', icon: User, to: isAdmin ? '/admin/profile' : '/profile', color: 'bg-gray-100 text-[#2C0140]' }
  ]

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Banner Bienvenida Estilo App Móvil */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4A008B] via-[#38006B] to-[#2C0140] text-white p-5 sm:p-7 shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0AE8C6]/15 blur-2xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#0AE8C6]">
              <Sparkles size={12} />
              Belleza a Domicilio
            </span>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-[11px] font-bold bg-[#0AE8C6] text-[#2C0140] px-3 py-1 rounded-full"
              >
                Ir a Panel Admin
              </Link>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-tight leading-tight">
              ¡Hola, {user?.first_name || 'Bienvenida'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1">
              Agenda tu próximo tratamiento desde tu celular sin esperas.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/book"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#0AE8C6] text-[#2C0140] px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
            >
              Agendar Cita Ahora
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Botones de Acción Rápida Estilo App Nativa */}
      <section className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {quickActions.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white border border-[#ececec] rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-2xs active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="text-[11px] font-bold text-[#2C0140] text-center leading-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </section>

      {/* Tarjeta de Próxima Cita Activa (Si existe) */}
      {nextAppointment && (
        <section className="bg-white rounded-3xl border border-[#4A008B]/15 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A008B] bg-[#F3E8FF] px-2.5 py-1 rounded-full">
              Tu Próxima Cita
            </span>
            <Link to="/my-appointments" className="text-xs font-bold text-[#4A008B] flex items-center gap-1">
              Ver detalle <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2C0140] text-[#0AE8C6] flex items-center justify-center shrink-0">
                <Calendar size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#2C0140] text-base truncate font-tight">
                  {nextAppointment.service_details?.name || 'Servicio reservado'}
                </h3>
                <p className="text-xs text-[#555555] capitalize">
                  {formatDateShort(nextAppointment.timeslot_details?.date)} • {nextAppointment.timeslot_details?.start_time?.substring(0, 5)} hrs
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0AE8C6]/15 text-[#07a68e] shrink-0">
              {STATUS_LABELS[nextAppointment.status] || 'Activa'}
            </span>
          </div>
        </section>
      )}

      {/* Catálogo Rápido de Tratamientos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-[#2C0140] font-tight">Tratamientos Destacados</h2>
            <p className="text-xs text-[#555555]">Selecciona uno para reservar a domicilio</p>
          </div>
          <Link to="/services" className="text-xs font-bold text-[#4A008B] hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/book/${service.id}`}
              className="bg-white rounded-2xl border border-[#ececec] p-4 flex items-center justify-between gap-3 hover:border-[#4A008B]/30 active:scale-[0.99] transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#4A008B] flex items-center justify-center shrink-0">
                  <Scissors size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#2C0140] text-sm sm:text-base truncate font-tight">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#555555] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-[#0AE8C6]" />
                      {service.duration} min
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      {service.provider_email ? service.provider_email.split('@')[0] : 'Profesional'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-base font-bold text-[#4A008B] font-tight">
                  ${parseFloat(service.price).toLocaleString()}
                </p>
                <span className="inline-block text-[10px] font-bold text-[#2C0140] bg-[#0AE8C6] px-2.5 py-0.5 rounded-lg mt-1">
                  Reservar
                </span>
              </div>
            </Link>
          ))}

          {!loading && services.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-[#e6e6e6] p-6 text-center text-xs text-[#555555]">
              Pronto habrá nuevos tratamientos disponibles.
            </div>
          )}
        </div>
      </section>

      {/* Beneficios Compactos */}
      <section className="bg-white rounded-3xl border border-[#ececec] p-4 sm:p-5 grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-[#0AE8C6]/15 text-[#2C0140] shrink-0">
            <MapPin size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#2C0140]">A Domicilio</p>
            <p className="text-[11px] text-[#555555]">Vamos directo a tu hogar</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-[#F3E8FF] text-[#4A008B] shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#2C0140]">En Tiempo Real</p>
            <p className="text-[11px] text-[#555555]">Avisos al instante</p>
          </div>
        </div>
      </section>
    </div>
  )
}
