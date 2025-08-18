import { User } from '../types'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from './api'

interface LoginResponse {
  user: User
  token: string
}

interface RegisterResponse {
  user: User
  token: string
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    })
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<RegisterResponse> {
    return await apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      email,
      password,
      firstName,
      lastName,
    })
  }

  async getProfile(): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.AUTH.PROFILE)
  }

  async refreshToken(): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH)
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      // Ignore logout errors as they're not critical
      console.warn('Logout request failed:', error)
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return await apiClient.patch<User>(API_ENDPOINTS.AUTH.PROFILE, data)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return await apiClient.post(`${API_ENDPOINTS.AUTH.PROFILE}/change-password`, {
      currentPassword,
      newPassword,
    })
  }

  async requestPasswordReset(email: string): Promise<void> {
    return await apiClient.post('/api/auth/request-password-reset', {
      email,
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return await apiClient.post('/api/auth/reset-password', {
      token,
      newPassword,
    })
  }
}

export const authService = new AuthService()
export default authService