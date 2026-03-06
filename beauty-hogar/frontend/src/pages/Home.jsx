import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Scissors, 
  Clock, 
  Star, 
  Heart, 
  Shield, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Users,
  MapPin
} from 'lucide-react'

export default function Home() {
  // Características con iconos y descripciones actualizadas para el concepto "Premium"
  const features = [
    {
      icon: Calendar,
      title: 'Reserva Inteligente',
      description: 'Agenda en tiempo real con confirmación inmediata por WhatsApp y correo.'
    },
    {
      icon: Clock,
      title: 'Tu Tiempo, Tu Regla',
      description: 'Bloquea horarios flexibles que se adaptan a tu apretada agenda diaria.'
    },
    {
      icon: Star,
      title: 'Resultados VIP',
      description: 'Especialistas capacitadas con productos de alta gama para tu cuidado.'
    },
    {
      icon: MapPin,
      title: 'Donde tú estés',
      description: 'Llevamos la experiencia del salón a la comodidad de tu living o habitación.'
    }
  ]

  // Estadísticas que ahora usan el color Turquesa corporativo (#0AE8C6)
  const stats = [
    { label: 'Servicios Realizados', value: '1.2k+' },
    { label: 'Calificación Media', value: '4.9/5' },
    { label: 'Profesionales Activas', value: '12+' }
  ]

  return (
    <div className="space-y-24 pb-20 font-sans animate-in fade-in duration-700">
      
      {/* SECCIÓN HERO: Gradientes con colores morados corporativos */}
      <section className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-[#4A008B] via-[#7B1FA2] to-[#2C0140] text-white p-10 lg:p-24 shadow-2xl shadow-purple-900/30">
        {/* Decoración de fondo premium */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#0AE8C6]/5 blur-[120px] rounded-full -mr-20" />
        
        <div className="relative z-10 max-w-4xl space-y-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.25em] animate-pulse">
            <Sparkles size={16} className="text-[#0AE8C6]" />
            La nueva era de la belleza a domicilio
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-bold font-tight leading-[0.85] tracking-tighter">
            Tu salón de <br /> 
            belleza <span className="text-[#0AE8C6]">donde sea</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-purple-100/90 max-w-2xl leading-relaxed font-medium">
            Agendamiento 100% digital para personas que valoran la comodidad. 
            Calidad profesional sin el estrés del tráfico ni las esperas.
          </p>
          
          <div className="flex flex-wrap gap-6 pt-6">
            <Link 
              to="/services" 
              className="bg-[#0AE8C6] text-[#2C0140] px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-3"
            >
              Ver Tratamientos
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/book" 
              className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-12 py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Agendar Ahora
            </Link>
          </div>
        </div>

        {/* Elemento Decorativo: Icono Scissors con opacidad baja */}
        <div className="absolute right-[-10%] bottom-[-10%] w-2/3 h-full opacity-[0.03] pointer-events-none -rotate-12">
          <Scissors className="w-full h-full text-white" />
        </div>
      </section>

      {/* SECCIÓN STATS: Enfoque en tipografía InterTight */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 px-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center group">
            <p className="text-5xl lg:text-7xl font-bold text-[#4A008B] font-tight group-hover:scale-110 transition-transform duration-500">
              {stat.value}
            </p>
            <div className="h-1 w-12 bg-[#0AE8C6] mx-auto my-4 rounded-full" />
            <p className="text-[#555555] text-xs font-black uppercase tracking-[0.3em]">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* GRID DE CARACTERÍSTICAS: Diseño de tarjetas "Soft" */}
      <section className="space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#2C0140] font-tight tracking-tight">¿Por qué Beauty Hogar?</h2>
          <p className="text-[#555555] text-lg font-medium leading-relaxed italic">
            "Redefinimos la experiencia de autocuidado combinando tecnología y calidez humana."
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white p-10 rounded-[3rem] border border-[#e6e6e6] hover:border-[#4A008B]/20 hover:shadow-2xl transition-all group hover:-translate-y-2 relative overflow-hidden">
                <div className="w-16 h-16 bg-[#F3E8FF] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#4A008B] transition-all duration-500 transform group-hover:rotate-[360deg]">
                  <Icon className="w-8 h-8 text-[#4A008B] group-hover:text-white" />
                </div>
                <h3 className="font-bold text-[#2C0140] mb-4 text-xl font-tight leading-none">{feature.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed font-medium">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA FINAL: Impacto visual máximo */}
      <section className="relative bg-[#2C0140] rounded-[4rem] p-12 lg:p-24 text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-10 w-64 h-64 border-[20px] border-[#0AE8C6] rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 right-10 w-80 h-80 border-[20px] border-[#4A008B] rounded-full translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
          <h2 className="text-4xl lg:text-6xl font-bold text-white font-tight leading-[1.1] tracking-tighter">
            Únete a la revolución de <br /> 
            la belleza inteligente
          </h2>
          <p className="text-purple-100/80 text-lg font-medium">
            Más de 500 clientes en Santiago ya confían en nuestro sistema de agendamiento 
            para sus momentos de desconexión.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
            <Link 
              to="/book" 
              className="w-full sm:w-auto px-16 py-6 bg-[#0AE8C6] text-[#2C0140] font-black text-sm uppercase tracking-widest rounded-[1.5rem] hover:scale-105 transition-all shadow-2xl shadow-cyan-900/40"
            >
              Reservar Cita Ahora
            </Link>
            <div className="flex items-center gap-3 text-white/90 text-sm font-bold uppercase tracking-widest">
              <CheckCircle2 size={24} className="text-[#0AE8C6]" />
              Sin cargos por cancelación
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}