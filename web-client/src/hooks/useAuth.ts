import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '../types'
import { authService } from '../services/auth'
import { LOCAL_STORAGE_KEYS } from '../utils/constants'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
          const userData = await authService.getProfile()
          setUser(userData)
        }
      } catch (error) {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: userData, token } = await authService.login(email, password)
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token)
      setUser(userData)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true)
    try {
      const { user: userData, token } = await authService.register(email, password, firstName, lastName)
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token)
      setUser(userData)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)
    setUser(null)
    authService.logout()
  }

  const refreshAuth = async () => {
    try {
      const userData = await authService.getProfile()
      setUser(userData)
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshAuth,
  }
}