export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserProfile
  token: string
  refreshToken?: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UserPreferences {
  currency: string
  dateFormat: string
  timeFormat: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    budgetAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
  }
  privacy: {
    shareAnalytics: boolean
    showInLeaderboards: boolean
  }
}

export type UserRole = 'user' | 'admin' | 'moderator'

export interface UserSession {
  id: string
  userId: string
  token: string
  refreshToken?: string
  expiresAt: Date
  lastActivityAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}