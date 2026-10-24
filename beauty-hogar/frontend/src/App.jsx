import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

// Páginas Públicas y de Clientes
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Services from './pages/Services'
import BookAppointment from './pages/BookAppointment'
import MyAppointments from './pages/MyAppointments'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

// Páginas de Administrador
import AdminDashboard from './pages/admin/Dashboard'
import AdminSpecialists from './pages/admin/Specialists'
import AdminAppointments from './pages/admin/Appointments'
import AdminServices from './pages/admin/Services'
import AdminTimeSlots from './pages/admin/TimeSlots'
import AdminClients from './pages/admin/Clients'
import AdminNotifications from './pages/admin/Notifications'

// Páginas de Especialista / Trabajador
import WorkerDashboard from './pages/worker/WorkerDashboard'

function PrivateRoute({ adminOnly = false, workerOnly = false, clientOnly = false }) {
  const { user, loading, isAdmin, isWorker } = useAuth()
  
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#2C0140]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0AE8C6]"></div>
    </div>
  )

  if (!user) return <Navigate to="/login" />
  
  if (adminOnly && !isAdmin) return <Navigate to={isWorker ? "/worker" : "/"} replace />
  if (workerOnly && !isWorker && !isAdmin) return <Navigate to="/" replace />
  // Si un especialista (peluquero, barbero, etc.) entra a la raíz '/', lo llevamos directo a su panel '/worker'
  if (clientOnly && isWorker) return <Navigate to="/worker" replace />
  
  return <Outlet />
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas Protegidas de Clientes */}
        <Route element={<PrivateRoute clientOnly={true} />}>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="book/:serviceId?" element={<BookAppointment />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Rutas Protegidas de Especialista / Trabajador */}
        <Route path="/worker" element={<PrivateRoute workerOnly={true} />}>
          <Route element={<Layout worker={true}><Outlet /></Layout>}>
            <Route index element={<WorkerDashboard />} />
            <Route path="appointments" element={<WorkerDashboard />} />
            <Route path="services" element={<WorkerDashboard />} />
            <Route path="timeslots" element={<WorkerDashboard />} />
            <Route path="earnings" element={<WorkerDashboard />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Rutas Protegidas de Administrador */}
        <Route path="/admin" element={<PrivateRoute adminOnly={true} />}>
          <Route element={<Layout admin={true}><Outlet /></Layout>}>
            <Route index element={<AdminDashboard />} />
            <Route path="specialists" element={<AdminSpecialists />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="timeslots" element={<AdminTimeSlots />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
