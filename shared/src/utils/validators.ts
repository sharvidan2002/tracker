import Joi from 'joi'

// User Validation Schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/),
    lastName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/),
    email: Joi.string().email()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
  })
}

// Expense Validation Schemas
export const expenseSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().precision(2).max(1000000).required().messages({
      'number.positive': 'Amount must be a positive number',
      'number.precision': 'Amount can have at most 2 decimal places',
      'number.max': 'Amount cannot exceed $1,000,000',
      'any.required': 'Amount is required'
    }),
    description: Joi.string().min(1).max(255).trim().required().messages({
      'string.min': 'Description cannot be empty',
      'string.max': 'Description cannot exceed 255 characters',
      'any.required': 'Description is required'
    }),
    category: Joi.string().max(100).trim().optional(),
    merchant: Joi.string().max(100).trim().optional(),
    date: Joi.date().iso().max('now').required().messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date cannot be in the future',
      'any.required': 'Date is required'
    }),
    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).optional(),
    paymentMethod: Joi.string().valid(
      'cash', 'credit_card', 'debit_card', 'bank_transfer', 'paypal',
      'venmo', 'apple_pay', 'google_pay', 'cryptocurrency', 'check', 'other'
    ).optional(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional()
    }).optional()
  }),

  update: Joi.object({
    amount: Joi.number().positive().precision(2).max(1000000).optional(),
    description: Joi.string().min(1).max(255).trim().optional(),
    category: Joi.string().max(100).trim().optional(),
    merchant: Joi.string().max(100).trim().optional(),
    date: Joi.date().iso().max('now').optional(),
    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).optional(),
    paymentMethod: Joi.string().valid(
      'cash', 'credit_card', 'debit_card', 'bank_transfer', 'paypal',
      'venmo', 'apple_pay', 'google_pay', 'cryptocurrency', 'check', 'other'
    ).optional()
  }),

  filters: Joi.object({
    category: Joi.string().max(100).optional(),
    merchant: Joi.string().max(100).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    minAmount: Joi.number().min(0).optional(),
    maxAmount: Joi.number().min(Joi.ref('minAmount')).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    paymentMethod: Joi.string().valid(
      'cash', 'credit_card', 'debit_card', 'bank_transfer', 'paypal',
      'venmo', 'apple_pay', 'google_pay', 'cryptocurrency', 'check', 'other'
    ).optional(),
    hasReceipt: Joi.boolean().optional(),
    isRecurring: Joi.boolean().optional()
  }),

  search: Joi.object({
    query: Joi.string().max(200).optional(),
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('date', 'amount', 'description', 'category', 'merchant', 'createdAt').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }).concat(expenseSchemas.filters)
}

// Budget Validation Schemas
export const budgetSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).trim().required().messages({
      'string.min': 'Budget name cannot be empty',
      'string.max': 'Budget name cannot exceed 100 characters',
      'any.required': 'Budget name is required'
    }),
    category: Joi.string().max(100).trim().optional(),
    amount: Joi.number().positive().precision(2).max(10000000).required().messages({
      'number.positive': 'Budget amount must be positive',
      'number.precision': 'Amount can have at most 2 decimal places',
      'number.max': 'Budget amount cannot exceed $10,000,000',
      'any.required': 'Budget amount is required'
    }),
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'custom').required(),
    alertThreshold: Joi.number().min(0).max(100).default(80),
    alertsEnabled: Joi.boolean().default(true),
    rollover: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).optional(),
    description: Joi.string().max(500).trim().optional(),
    startDate: Joi.date().iso().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100).trim().optional(),
    amount: Joi.number().positive().precision(2).max(10000000).optional(),
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'custom').optional(),
    alertThreshold: Joi.number().min(0).max(100).optional(),
    alertsEnabled: Joi.boolean().optional(),
    rollover: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string().max(50).trim()).max(10).optional(),
    description: Joi.string().max(500).trim().optional(),
    isActive: Joi.boolean().optional()
  }),

  filters: Joi.object({
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly', 'custom').optional(),
    category: Joi.string().max(100).optional(),
    isActive: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    alertStatus: Joi.string().valid('ok', 'warning', 'exceeded').optional()
  })
}

// Common Validation Schemas
export const commonSchemas = {
  id: Joi.string().guid({ version: 'uuidv4' }).required(),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  }),

  sort: Joi.object({
    sortBy: Joi.string().required(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  }),

  tags: Joi.array().items(
    Joi.string().max(50).trim().pattern(/^[a-zA-Z0-9_-]+$/)
  ).max(10).unique()
}

// ML/AI Validation Schemas
export const mlSchemas = {
  categorize: Joi.object({
    description: Joi.string().min(1).max(255).trim().required(),
    merchant: Joi.string().max(100).trim().optional()
  }),

  bulkCategorize: Joi.object({
    expenses: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        description: Joi.string().min(1).max(255).trim().required(),
        merchant: Joi.string().max(100).trim().optional()
      })
    ).min(1).max(100).required()
  }),

  feedback: Joi.object({
    expenseId: Joi.string().guid().required(),
    suggestedCategory: Joi.string().max(100).required(),
    actualCategory: Joi.string().max(100).required(),
    confidence: Joi.number().min(0).max(1).optional()
  })
}

// File Upload Validation
export const fileSchemas = {
  upload: Joi.object({
    file: Joi.any().required(),
    maxSize: Joi.number().default(5242880), // 5MB
    allowedTypes: Joi.array().items(Joi.string()).default(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
  }),

  import: Joi.object({
    format: Joi.string().valid('csv', 'xlsx', 'json').required(),
    mapping: Joi.object().required(),
    options: Joi.object({
      skipHeader: Joi.boolean().default(true),
      delimiter: Joi.string().length(1).default(','),
      dateFormat: Joi.string().default('YYYY-MM-DD'),
      dryRun: Joi.boolean().default(false)
    }).optional()
  })
}

// Helper Functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password should contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateCurrency = (amount: number): boolean => {
  return Number.isFinite(amount) && amount > 0 && Number(amount.toFixed(2)) === amount
}

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate && endDate <= new Date()
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Schema validation helper
export const validate = <T>(schema: Joi.ObjectSchema, data: any): { isValid: boolean; value?: T; errors?: string[] } => {
  const { error, value } = schema.validate(data, { abortEarly: false })

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    }
  }

  return {
    isValid: true,
    value: value as T
  }
}