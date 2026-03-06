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
  CheckCircle2
} from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: 'Reserva 24/7',
      description: 'Gestiona tu cita en segundos desde cualquier dispositivo.'
    },
    {
      icon: Clock,
      title: 'A Tu Ritmo',
      description: 'Horarios flexibles que se adaptan a tu estilo de vida.'
    },
    {
      icon: Star,
      title: 'Calidad Premium',
      description: 'Productos y profesionales seleccionados bajo altos estándares.'
    },
    {
      icon: Shield,
      title: 'Seguridad Total',
      description: 'Atención profesional garantizada en la comodidad de tu hogar.'
    }
  ]

  const stats = [
    { label: 'Clientes Felices', value: '500+' },
    { label: 'Tratamientos', value: '25+' },
    { label: 'Especialistas', value: '10+' }
  ]

  return (
    <div className="space-y-20 pb-20 font-sans">
      {/* Hero Section Premium */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#4A008B] via-[#7B1FA2] to-[#2C0140] text-white p-10 lg:p-20 shadow-2xl shadow-purple-900/20">
        <div className="relative z-10 max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
            <Sparkles size={14} className="text-[#0AE8C6]" />
            Tu belleza, tu tiempo, tu hogar
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold font-tight leading-[0.9] tracking-tighter">
            Especialistas en resaltar tu <span className="text-[#0AE8C6]">esencia</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-purple-100 max-w-xl leading-relaxed font-medium">
            Disfruta de una experiencia de salón profesional sin salir de casa. 
            Agendamiento inteligente para personas que valoran su tiempo.
          </p>
          
          <div className="flex flex-wrap gap-5 pt-4">
            <Link 
              to="/services" 
              className="bg-[#0AE8C6] text-[#2C0140] px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
            >
              Explorar Servicios
              <ArrowRight size={18} />
            </Link>
            <Link 
              to="/book" 
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all"
            >
              Reservar Cita
            </Link>
          </div>
        </div>

        {/* Elemento Decorativo Flotante */}
        <div className="absolute right-[-5%] top-[-10%] w-1/2 h-[120%] opacity-10 pointer-events-none rotate-12">
          <Scissors className="w-full h-full text-white" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-8 px-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center space-y-1">
            <p className="text-4xl lg:text-5xl font-bold text-[#4A008B] font-tight">{stat.value}</p>
            <p className="text-[#555555] text-xs font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features Grid */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold text-[#2C0140] font-tight tracking-tight">¿Por qué elegir Beauty Hogar?</h2>
          <p className="text-[#555555] font-medium">Llevamos el bienestar a tu puerta con un sistema diseñado para tu comodidad.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-[#e6e6e6] hover:shadow-xl transition-all group hover:-translate-y-1">
                <div className="w-14 h-14 bg-[#F3E8FF] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#4A008B] transition-colors">
                  <Icon className="w-6 h-6 text-[#4A008B] group-hover:text-white" />
                </div>
                <h3 className="font-bold text-[#2C0140] mb-3 text-lg font-tight">{feature.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed font-medium">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Final Empoderador */}
      <section className="relative bg-[#2C0140] rounded-[3rem] p-10 lg:p-20 text-center overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 border-8 border-[#0AE8C6] rounded-full" />
            <div className="absolute bottom-10 right-10 w-60 h-60 border-8 border-[#4A008B] rounded-full" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white font-tight leading-tight">
            ¿Lista para tu momento <br /> de desconexión?
          </h2>
          <p className="text-purple-100 text-lg font-medium">
            Únete a nuestra comunidad de clientes que ya transformaron su rutina de cuidado personal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/book" 
              className="w-full sm:w-auto px-12 py-5 bg-[#0AE8C6] text-[#2C0140] font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-cyan-900/20"
            >
              Agendar Cita Ahora
            </Link>
            <div className="flex items-center gap-2 text-white/80 text-sm font-bold uppercase tracking-tighter">
              <CheckCircle2 size={18} className="text-[#0AE8C6]" />
              Cancelación flexible
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}