import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      // Usamos la ruta limpia para evitar el error de doble /api/
      const response = await api.get('users/profile/')
      setUser(response.data)
    } catch (error) {
      console.error("Error al cargar perfil:", error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('users/login/', { email, password })
      const { access, user: userData } = response.data
      
      localStorage.setItem('token', access)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Error al iniciar sesión' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('users/register/client/', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Error al registrar' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    // Verificación de rol basada en tu modelo de Django
    isAdmin: user?.role === 'admin' 
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Si está cargando, mostramos un spinner con tus colores corporativos.
        Esto evita que el contenido principal falle por falta de datos del usuario.
      */}
      {!loading ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-[#2C0140]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0AE8C6]"></div>
        </div>
      )}
    </AuthContext.Provider>
  )
}