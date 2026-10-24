import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/profile/')
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error("Error al cargar perfil:", error)
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('users/profile/', profileData)
      setUser(response.data)
      return { success: true, user: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'No se pudo actualizar el perfil'
      }
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('users/login/', { email, password })
      const { access, user: userData } = response.data
      
      localStorage.setItem('token', access)
      setToken(access)
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
      const isAdminRole = userData.role === 'admin'
      const endpoint = isAdminRole ? 'users/register/admin/' : 'users/register/client/'
      const payload = { ...userData }
      delete payload.role
      if (!isAdminRole) {
        delete payload.secret_key
      }
      const response = await api.post(endpoint, payload)
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
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    loading,
    isAdmin: user?.role === 'admin' || Boolean(user?.is_admin),
    isWorker: user?.role === 'worker'
  }

  return (
    <AuthContext.Provider value={value}>
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
