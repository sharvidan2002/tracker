import { Request, Response, NextFunction } from 'express'
import { ValidationError } from 'sequelize'
import { MongoError } from 'mongodb'
import { config } from '../config/environment'

export interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const createError = (message: string, statusCode: number): CustomError => {
  return new CustomError(message, statusCode)
}

const handleSequelizeValidationError = (err: ValidationError): CustomError => {
  const errors = err.errors.map((error) => error.message)
  const message = `Validation error: ${errors.join('. ')}`
  return new CustomError(message, 400)
}

const handleSequelizeUniqueConstraintError = (err: any): CustomError => {
  const field = Object.keys(err.fields)[0]
  const message = `${field} already exists`
  return new CustomError(message, 400)
}

const handleSequelizeForeignKeyConstraintError = (err: any): CustomError => {
  const message = 'Invalid reference to related resource'
  return new CustomError(message, 400)
}

const handleSequelizeDatabaseError = (err: any): CustomError => {
  let message = 'Database error occurred'
  let statusCode = 500

  // Handle specific database errors
  if (err.name === 'SequelizeConnectionError') {
    message = 'Database connection failed'
  } else if (err.name === 'SequelizeTimeoutError') {
    message = 'Database operation timed out'
  } else if (err.name === 'SequelizeHostNotFoundError') {
    message = 'Database host not found'
  } else if (err.name === 'SequelizeHostNotReachableError') {
    message = 'Database host not reachable'
  } else if (err.name === 'SequelizeInvalidConnectionError') {
    message = 'Invalid database connection'
  } else if (err.name === 'SequelizeConnectionRefusedError') {
    message = 'Database connection refused'
  }

  return new CustomError(message, statusCode)
}

const handleMongoError = (err: MongoError): CustomError => {
  let message = 'Database error'
  let statusCode = 500

  if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys((err as any).keyValue)[0]
    message = `${field} already exists`
    statusCode = 400
  } else if (err.code === 11001) {
    // Duplicate key on update
    message = 'Duplicate key error on update'
    statusCode = 400
  } else if (err.code === 12502) {
    // Invalid text search
    message = 'Invalid text search query'
    statusCode = 400
  } else if (err.code === 16755) {
    // Invalid ObjectId
    message = 'Invalid ID format'
    statusCode = 400
  }

  return new CustomError(message, statusCode)
}

const handleJWTError = (): CustomError => {
  return new CustomError('Invalid token. Please log in again.', 401)
}

const handleJWTExpiredError = (): CustomError => {
  return new CustomError('Your token has expired. Please log in again.', 401)
}

const handleCastError = (err: any): CustomError => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new CustomError(message, 400)
}

const handleValidationError = (err: any): CustomError => {
  const errors = Object.values(err.errors).map((val: any) => val.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new CustomError(message, 400)
}

const handleMulterError = (err: any): CustomError => {
  let message = 'File upload error'
  let statusCode = 400

  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large'
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files'
  } else if (err.code === 'LIMIT_FIELD_KEY') {
    message = 'Field name too long'
  } else if (err.code === 'LIMIT_FIELD_VALUE') {
    message = 'Field value too long'
  } else if (err.code === 'LIMIT_FIELD_COUNT') {
    message = 'Too many fields'
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected field'
  }

  return new CustomError(message, statusCode)
}

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err)

    res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try again later.',
    })
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (config.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
      error = handleSequelizeValidationError(err as ValidationError)
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      error = handleSequelizeUniqueConstraintError(err)
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      error = handleSequelizeForeignKeyConstraintError(err)
    } else if (err.name?.startsWith('Sequelize')) {
      error = handleSequelizeDatabaseError(err)
    } else if (err.name === 'MongoError') {
      error = handleMongoError(err as MongoError)
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJWTError()
    } else if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError()
    } else if (err.name === 'CastError') {
      error = handleCastError(err)
    } else if (err.name === 'ValidationError') {
      error = handleValidationError(err)
    } else if (err.name === 'MulterError') {
      error = handleMulterError(err)
    }

    sendErrorProd(error, res)
  }
}

// Async error handler wrapper
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const err = new CustomError(`Not found - ${req.originalUrl}`, 404)
  next(err)
}

// Rate limiting error handler
export const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  })
}

// CORS error handler
export const corsHandler = (req: Request, res: Response): void => {
  res.status(403).json({
    success: false,
    message: 'CORS policy violation - origin not allowed',
  })
}

// Helper function to create success responses
export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): void => {
  const response: any = {
    success: true,
    message,
  }

  if (data !== undefined) {
    response.data = data
  }

  res.status(statusCode).json(response)
}

// Helper function to create paginated responses
export const sendPaginatedResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: any[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      ...pagination,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
  })
}

// Helper function to log errors
export const logError = (error: Error, req?: Request): void => {
  const timestamp = new Date().toISOString()
  const method = req?.method || 'UNKNOWN'
  const url = req?.originalUrl || 'UNKNOWN'
  const userAgent = req?.get('User-Agent') || 'UNKNOWN'
  const ip = req?.ip || 'UNKNOWN'

  console.error(`
[${timestamp}] ERROR:
Message: ${error.message}
Stack: ${error.stack}
Method: ${method}
URL: ${url}
IP: ${ip}
User-Agent: ${userAgent}
  `)

  // In production, you might want to send this to a logging service
  // like Winston, Sentry, or CloudWatch
}

// Global unhandled rejection handler
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    // Application specific logging, throwing an error, or other logic here
    process.exit(1)
  })
}

// Global uncaught exception handler
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error)
    process.exit(1)
  })
}