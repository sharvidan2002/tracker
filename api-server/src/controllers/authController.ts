import { Request, Response, NextFunction } from 'express'
import { User } from '../models/User'
import { generateTokens, verifyRefreshToken, AuthenticatedRequest } from '../middleware/auth'
import { catchAsync, createError, sendResponse } from '../middleware/errorHandler'
import { LoginRequest, RegisterRequest, AuthResponse, UserResponse } from '../types'

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, firstName, lastName }: RegisterRequest = req.body

  // Check if user already exists
  const existingUser = await User.findByEmail(email)
  if (existingUser) {
    return next(createError('User with this email already exists', 400))
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
  })

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
  })

  // Update last login
  user.lastLoginAt = new Date()
  await user.save()

  const userResponse: UserResponse = user.toJSON() as UserResponse
  const authResponse: AuthResponse = {
    user: userResponse,
    token: accessToken,
    refreshToken,
  }

  sendResponse(res, 201, 'User registered successfully', authResponse)
})

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password }: LoginRequest = req.body

  // Find user and include password for verification
  const user = await User.scope('withPassword').findByEmail(email)
  if (!user) {
    return next(createError('Invalid email or password', 401))
  }

  // Check if user is active
  if (!user.isActive) {
    return next(createError('Account is deactivated', 401))
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    return next(createError('Invalid email or password', 401))
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
  })

  // Update last login
  user.lastLoginAt = new Date()
  await user.save()

  const userResponse: UserResponse = user.toJSON() as UserResponse
  const authResponse: AuthResponse = {
    user: userResponse,
    token: accessToken,
    refreshToken,
  }

  sendResponse(res, 200, 'Login successful', authResponse)
})

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { refreshToken: token } = req.body

  if (!token) {
    return next(createError('Refresh token is required', 400))
  }

  try {
    const decoded = verifyRefreshToken(token)

    // Verify user still exists
    const user = await User.findByPk(decoded.id)
    if (!user || !user.isActive) {
      return next(createError('User not found or inactive', 401))
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
    })

    const authResponse: AuthResponse = {
      user: user.toJSON() as UserResponse,
      token: accessToken,
      refreshToken: newRefreshToken,
    }

    sendResponse(res, 200, 'Token refreshed successfully', authResponse)
  } catch (error) {
    return next(createError('Invalid refresh token', 401))
  }
})

export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await User.findByPk(req.user!.id)

  if (!user) {
    throw createError('User not found', 404)
  }

  const userResponse: UserResponse = user.toJSON() as UserResponse
  sendResponse(res, 200, 'Profile retrieved successfully', userResponse)
})

export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { firstName, lastName } = req.body
  const userId = req.user!.id

  const user = await User.findByPk(userId)
  if (!user) {
    return next(createError('User not found', 404))
  }

  // Update user fields
  if (firstName !== undefined) user.firstName = firstName
  if (lastName !== undefined) user.lastName = lastName

  await user.save()

  const userResponse: UserResponse = user.toJSON() as UserResponse
  sendResponse(res, 200, 'Profile updated successfully', userResponse)
})

export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user!.id

  // Get user with password
  const user = await User.scope('withPassword').findByPk(userId)
  if (!user) {
    return next(createError('User not found', 404))
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword)
  if (!isCurrentPasswordValid) {
    return next(createError('Current password is incorrect', 400))
  }

  // Update password
  user.password = newPassword
  await user.save()

  sendResponse(res, 200, 'Password changed successfully')
})

export const deactivateAccount = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user!.id

  const user = await User.findByPk(userId)
  if (!user) {
    return next(createError('User not found', 404))
  }

  user.isActive = false
  await user.save()

  sendResponse(res, 200, 'Account deactivated successfully')
})

export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // For now, we just send a success response
  // In a more sophisticated system, we might blacklist the token
  sendResponse(res, 200, 'Logout successful')
})

// Admin endpoints (for future use)
export const getAllUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  const { count, rows } = await User.findAndCountAll({
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  })

  const users: UserResponse[] = rows.map(user => user.toJSON() as UserResponse)

  const pagination = {
    page: Number(page),
    limit: Number(limit),
    total: count,
    totalPages: Math.ceil(count / Number(limit)),
    hasNextPage: Number(page) < Math.ceil(count / Number(limit)),
    hasPrevPage: Number(page) > 1,
  }

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
    pagination,
  })
})

// Add withPassword scope to User model
User.addScope('withPassword', {
  attributes: { include: ['password'] }
})