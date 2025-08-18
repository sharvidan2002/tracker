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

const handleMongoError = (err: MongoError): CustomError => {
  let message = 'Database error'
  let statusCode = 500

  if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys((err as any).keyValue)[0]
    message = `${field} already exists`
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
      message: 'Something went wrong!',
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
    } else if (err.name === 'MongoError') {
      error = handleMongoError(err as MongoError)
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJWTError()
    } else if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError()
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
  }
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  })
}