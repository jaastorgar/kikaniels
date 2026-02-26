import { Link } from 'react-router-dom'
import { Calendar, Scissors, Clock, Star, Heart, Shield } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: 'Reserva Fácil',
      description: 'Agenda tu cita en minutos con nuestro sistema intuitivo'
    },
    {
      icon: Clock,
      title: 'Horarios Flexibles',
      description: 'Encuentra el horario perfecto que se adapte a tu agenda'
    },
    {
      icon: Star,
      title: 'Servicios Premium',
      description: 'Disfruta de nuestros servicios de alta calidad'
    },
    {
      icon: Heart,
      title: 'Atención Personalizada',
      description: 'Cuidamos cada detalle para tu satisfacción'
    }
  ]

  const stats = [
    { label: 'Clientes Satisfechos', value: '500+' },
    { label: 'Servicios Ofrecidos', value: '20+' },
    { label: 'Años de Experiencia', value: '5+' }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 lg:p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Bienvenida a <span className="text-primary-100">Beauty Hogar</span>
          </h1>
          <p className="text-lg text-primary-100 mb-8">
            Tu espacio de belleza y cuidado personal. Reserva tu cita hoy y descubre 
            una experiencia única de relajación y belleza.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/services" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              Ver Servicios
            </Link>
            <Link to="/book" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Reservar Ahora
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <Scissors className="w-full h-full" />
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">¿Por qué elegirnos?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card card-hover text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center p-6 bg-primary-50 border-primary-100">
            <p className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</p>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="card bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center p-8">
        <h2 className="text-2xl font-bold mb-4">¿Lista para tu transformación?</h2>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          No esperes más para consentirte. Nuestro equipo de profesionales está 
          listo para atenderte y hacer que te sientas increíble.
        </p>
        <Link to="/book" className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
          Agendar Cita Ahora
        </Link>
      </section>
    </div>
  )
}