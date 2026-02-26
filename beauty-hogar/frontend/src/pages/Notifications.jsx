import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/appointments/notifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/appointments/notifications/${id}/read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => markAsRead(n.id)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer` : 'No tienes notificaciones nuevas'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-secondary text-sm"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Sin notificaciones</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start gap-4 transition-all ${
                !notification.is_read ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                !notification.is_read ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <p className="text-gray-800 mb-1">{notification.message}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(notification.created_at), 'd MMMM yyyy, HH:mm', { locale: es })}
                </p>
              </div>

              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="p-2 hover:bg-white rounded-lg text-primary-600"
                  title="Marcar como leída"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}