import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Clock, DollarSign, ArrowRight, Loader2 } from 'lucide-react'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/services/')
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nuestros Servicios</h1>
        <p className="text-gray-600">Descubre todo lo que tenemos para ti</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="card card-hover overflow-hidden group">
            {service.image && (
              <div className="h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Scissors className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-2xl font-bold text-primary-600">
                ${service.price.toLocaleString()}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {service.duration_minutes} min
              </span>
            </div>

            <Link
              to={`/book/${service.id}`}
              className="flex items-center justify-center gap-2 w-full bg-primary-50 text-primary-600 py-2 rounded-lg font-medium hover:bg-primary-100 transition-colors"
            >
              Reservar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}