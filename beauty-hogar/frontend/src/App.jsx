import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Services from './pages/Services'
import BookAppointment from './pages/BookAppointment'
import MyAppointments from './pages/MyAppointments'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAppointments from './pages/admin/Appointments'
import AdminServices from './pages/admin/Services'
import AdminTimeSlots from './pages/admin/TimeSlots'
import AdminClients from './pages/admin/Clients'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (adminOnly && !user.is_admin) return <Navigate to="/" />
  
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="book/:serviceId?" element={<BookAppointment />} />
          <Route path="my-appointments" element={<MyAppointments />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <Layout admin={true} />
          </PrivateRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="time-slots" element={<AdminTimeSlots />} />
          <Route path="clients" element={<AdminClients />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App