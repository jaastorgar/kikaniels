import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Save,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  Scissors,
  Clock,
  Users,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

export default function Profile() {
  const { user, isAdmin, isWorker, updateProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwdData, setPwdData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: ''
  })
  const [showPwd, setShowPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [showPwdSection, setShowPwdSection] = useState(false)

  const [summary, setSummary] = useState({
    totalAppointments: 0,
    activeCount: 0,
    servicesCount: 0
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  useEffect(() => {
    const loadSummary = async () => {
      try {
        if (isAdmin) {
          const [statsRes, servicesRes] = await Promise.all([
            api.get('appointments/dashboard/stats/'),
            api.get('appointments/services/')
          ])
          setSummary({
            totalAppointments: statsRes.data?.total_appointments || 0,
            activeCount: statsRes.data?.pending_appointments || 0,
            servicesCount: Array.isArray(servicesRes.data) ? servicesRes.data.length : 0
          })
        } else if (isWorker) {
          const [statsRes, servicesRes] = await Promise.all([
            api.get('appointments/worker/stats/'),
            api.get('appointments/services/?mine=1')
          ])
          setSummary({
            totalAppointments: statsRes.data?.total_appointments || 0,
            activeCount: statsRes.data?.active_appointments || 0,
            servicesCount: Array.isArray(servicesRes.data) ? servicesRes.data.length : 0
          })
        } else {
          const res = await api.get('appointments/')
          const list = Array.isArray(res.data) ? res.data : []
          setSummary({
            totalAppointments: list.length,
            activeCount: list.filter(a => ['pending', 'confirmed', 'rescheduled'].includes(a.status)).length,
            servicesCount: 0
          })
        }
      } catch (e) {
        // Silencioso en resumen
      }
    }
    loadSummary()
  }, [isAdmin, isWorker])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    const result = await updateProfile(formData)
    if (result.success) {
      toast.success('Datos de tu perfil actualizados')
    } else {
      const msg = typeof result.error === 'object'
        ? Object.values(result.error).flat().join(' ')
        : result.error
      toast.error(msg || 'No se pudo actualizar el perfil')
    }
    setSavingProfile(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwdData.new_password.length < 8) {
      return toast.error('La nueva contraseña debe tener al menos 8 caracteres')
    }
    if (pwdData.new_password !== pwdData.new_password_confirm) {
      return toast.error('Las contraseñas nuevas no coinciden')
    }

    setSavingPwd(true)
    try {
      await api.post('users/change-password/', pwdData)
      toast.success('Contraseña actualizada correctamente')
      setPwdData({ current_password: '', new_password: '', new_password_confirm: '' })
      setShowPwdSection(false)
    } catch (error) {
      const errData = error.response?.data
      const msg = errData && typeof errData === 'object'
        ? Object.values(errData).flat().join(' ')
        : 'Error al cambiar la contraseña'
      toast.error(msg)
    } finally {
      setSavingPwd(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase()
  const formattedJoinDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'Reciente'

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10 font-sans">
      {/* Tarjeta Cabecera Nativa del Perfil */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4A008B] via-[#38006B] to-[#2C0140] text-white p-6 shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#0AE8C6]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl font-bold text-[#0AE8C6] shrink-0 shadow-lg">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0AE8C6]/20 border border-[#0AE8C6]/40 text-[#0AE8C6] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck size={12} />
              {isAdmin
                ? 'Administrador / Profesional'
                : isWorker
                ? `${user?.specialty_display || 'Especialista'} (${Number(user?.commission_rate ?? 60)}% comisión)`
                : 'Cuenta Cliente'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate font-tight">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-xs text-purple-200 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Mini Resumen Operativo según Rol */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-[#0AE8C6] font-tight">{summary.totalAppointments}</p>
            <p className="text-[10px] text-purple-100 uppercase font-bold tracking-wider">
              {isAdmin ? 'Citas Recibidas' : isWorker ? 'Citas Asignadas' : 'Total Reservas'}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-white font-tight">
              {isAdmin || isWorker ? summary.servicesCount : summary.activeCount}
            </p>
            <p className="text-[10px] text-purple-100 uppercase font-bold tracking-wider">
              {isAdmin || isWorker ? 'Mis Servicios' : 'Citas Activas'}
            </p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos según el Rol */}
      <div className="bg-white rounded-3xl border border-[#e6e6e6] p-4 shadow-xs">
        <p className="text-[11px] font-bold text-[#555555] uppercase tracking-wider px-2 mb-2.5">
          Accesos Rápidos
        </p>
        <div className="divide-y divide-gray-100">
          {isAdmin ? (
            <>
              <Link
                to="/admin/clients"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F3E8FF] text-[#4A008B]">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Directorio de Clientes</p>
                    <p className="text-xs text-[#555555]">Contactos y registro de clientes</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link
                to="/admin/timeslots"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0AE8C6]/15 text-[#2C0140]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Configurar Mis Horarios</p>
                    <p className="text-xs text-[#555555]">Abrir o bloquear turnos disponibles</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </>
          ) : isWorker ? (
            <>
              <Link
                to="/worker/services"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F3E8FF] text-[#4A008B]">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Mis Servicios y Precios</p>
                    <p className="text-xs text-[#555555]">Publica tus servicios y define cuánto cobras</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link
                to="/worker/timeslots"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0AE8C6]/15 text-[#2C0140]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Configurar Mis Horarios</p>
                    <p className="text-xs text-[#555555]">Habilita tus bloques para recibir clientes</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link
                to="/worker/appointments"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F3E8FF] text-[#4A008B]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Mi Agenda y Comisiones</p>
                    <p className="text-xs text-[#555555]">Atiende tus citas y revisa tus pagos</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/my-appointments"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#F3E8FF] text-[#4A008B]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Mis Citas Agendadas</p>
                    <p className="text-xs text-[#555555]">Revisa el estado de tus reservas</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link
                to="/book"
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0AE8C6]/15 text-[#2C0140]">
                    <Scissors size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C0140]">Agendar Nuevo Servicio</p>
                    <p className="text-xs text-[#555555]">Reserva atención a domicilio</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Formulario de Datos Personales */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-3xl border border-[#e6e6e6] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#2C0140] flex items-center gap-2">
            <User size={18} className="text-[#4A008B]" />
            Información Personal
          </h2>
          <span className="text-[11px] text-[#555555] font-medium">
            Miembro desde {formattedJoinDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Nombre</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm focus:bg-white focus:border-[#4A008B] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Apellido</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm focus:bg-white focus:border-[#4A008B] outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#555555] mb-1">Teléfono / WhatsApp</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm focus:bg-white focus:border-[#4A008B] outline-none"
              placeholder="+569..."
              required
            />
          </div>
        </div>

        {(isWorker || isAdmin) && (
          <div>
            <label className="block text-xs font-bold text-[#555555] mb-1">Presentación / Especialidad (Visible para clientes)</label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm focus:bg-white focus:border-[#4A008B] outline-none"
              placeholder="Ej: Estilista profesional con 5 años de experiencia en corte, colorimetría y brushing a domicilio..."
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#555555] mb-1">Correo Electrónico (No editable)</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full pl-10 pr-3.5 py-2.5 bg-gray-100 border border-[#e6e6e6] rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="w-full py-3 bg-[#4A008B] hover:bg-[#38006B] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
        >
          {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar Cambios
        </button>
      </form>

      {/* Sección de Seguridad / Cambiar Contraseña */}
      <div className="bg-white rounded-3xl border border-[#e6e6e6] p-5 shadow-xs">
        <button
          type="button"
          onClick={() => setShowPwdSection(!showPwdSection)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-[#4A008B]">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C0140]">Seguridad y Contraseña</h3>
              <p className="text-xs text-[#555555]">Actualiza tu clave de acceso</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#4A008B]">
            {showPwdSection ? 'Cerrar' : 'Cambiar'}
          </span>
        </button>

        {showPwdSection && (
          <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-gray-100 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#555555] mb-1">Contraseña Actual</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdData.current_password}
                  onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm outline-none focus:border-[#4A008B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#555555] mb-1">Nueva Contraseña (mín. 8)</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdData.new_password}
                  onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm outline-none focus:border-[#4A008B]"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#555555] mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdData.new_password_confirm}
                  onChange={(e) => setPwdData({ ...pwdData, new_password_confirm: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#e6e6e6] rounded-xl text-sm outline-none focus:border-[#4A008B]"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPwd}
              className="w-full py-2.5 bg-[#2C0140] text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {savingPwd ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} className="text-[#0AE8C6]" />}
              Actualizar Contraseña
            </button>
          </form>
        )}
      </div>

      {/* Botón Nativo de Cerrar Sesión */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 border border-red-100 transition-colors active:scale-98"
      >
        <LogOut size={18} />
        Cerrar Sesión en este Dispositivo
      </button>
    </div>
  )
}
