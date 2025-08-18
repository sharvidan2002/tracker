import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/environment'
import { User } from '../models/User'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      })
      return
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string
      email: string
    }

    // Verify user still exists and is active
    const user = await User.findByPk(decoded.id)
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      })
      return
    }

    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      next()
      return
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string
      email: string
    }

    const user = await User.findByPk(decoded.id)
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }

    next()
  } catch (error) {
    // For optional auth, we don't throw errors
    next()
  }
}

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
    return
  }

  // For now, we don't have admin roles implemented
  // This is a placeholder for future role-based access control
  next()
}

export const generateTokens = (user: { id: string; email: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  )

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  )

  return { accessToken, refreshToken }
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as {
    id: string
    email: string
  }
}