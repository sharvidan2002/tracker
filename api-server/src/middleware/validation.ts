import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ')

      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
      return
    }

    next()
  }
}

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false })

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ')

      res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
      return
    }

    next()
  }
}

// Common validation schemas
export const schemas = {
  // Authentication schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Expense schemas
  createExpense: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().min(1).max(255).required(),
    category: Joi.string().optional(),
    merchant: Joi.string().max(100).optional(),
    date: Joi.string().isoDate().required(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
  }),

  updateExpense: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    description: Joi.string().min(1).max(255).optional(),
    category: Joi.string().optional(),
    merchant: Joi.string().max(100).optional(),
    date: Joi.string().isoDate().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
  }),

  // Budget schemas
  createBudget: Joi.object({
    category: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    period: Joi.string().valid('weekly', 'monthly', 'yearly').required(),
  }),

  updateBudget: Joi.object({
    amount: Joi.number().positive().precision(2).optional(),
    period: Joi.string().valid('weekly', 'monthly', 'yearly').optional(),
  }),

  // Query schemas
  expenseQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string().optional(),
    merchant: Joi.string().optional(),
    dateFrom: Joi.string().isoDate().optional(),
    dateTo: Joi.string().isoDate().optional(),
    minAmount: Joi.number().positive().optional(),
    maxAmount: Joi.number().positive().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    sortBy: Joi.string().valid('date', 'amount', 'category', 'merchant').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    search: Joi.string().max(100).optional(),
  }),

  budgetQuery: Joi.object({
    period: Joi.string().valid('weekly', 'monthly', 'yearly').optional(),
  }),

  analyticsQuery: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').optional(),
    category: Joi.string().optional(),
  }),

  // ML service schemas
  categorizeExpense: Joi.object({
    description: Joi.string().min(1).max(255).required(),
    merchant: Joi.string().max(100).optional(),
  }),

  bulkCategorize: Joi.object({
    expenses: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        description: Joi.string().min(1).max(255).required(),
        merchant: Joi.string().max(100).optional(),
      })
    ).min(1).max(100).required(),
  }),
}

// Validation helpers
export const validateId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName]

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} parameter`,
      })
      return
    }

    // Basic UUID validation (adjust based on your ID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      })
      return
    }

    next()
  }
}

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20

  if (page < 1) {
    res.status(400).json({
      success: false,
      message: 'Page must be greater than 0',
    })
    return
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100',
    })
    return
  }

  req.query.page = page.toString()
  req.query.limit = limit.toString()

  next()
}