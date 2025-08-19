import Joi from 'joi'

// Base validation schemas
export const baseSchemas = {
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  email: Joi.string().email().lowercase().trim().max(255).required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().trim().min(1).max(100).required(),
  optionalName: Joi.string().trim().min(1).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,}$/).optional(),
  url: Joi.string().uri().optional(),
  currency: Joi.number().positive().precision(2).max(999999.99).required(),
  optionalCurrency: Joi.number().positive().precision(2).max(999999.99).optional(),
  date: Joi.date().iso().max('now').required(),
  optionalDate: Joi.date().iso().optional(),
  futureDate: Joi.date().iso().min('now').required(),
  description: Joi.string().trim().min(1).max(500).optional(),
  requiredDescription: Joi.string().trim().min(1).max(500).required(),
}

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    firstName: baseSchemas.name,
    lastName: baseSchemas.name,
    phone: baseSchemas.phone,
  }),

  login: Joi.object({
    email: baseSchemas.email,
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: baseSchemas.optionalName,
    lastName: baseSchemas.optionalName,
    phone: baseSchemas.phone,
    dateOfBirth: baseSchemas.optionalDate,
    currency: Joi.string().length(3).uppercase().optional(),
    timezone: Joi.string().optional(),
    language: Joi.string().length(2).lowercase().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: baseSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),

  forgotPassword: Joi.object({
    email: baseSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: baseSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
  }),
}

// Expense validation schemas
export const expenseSchemas = {
  create: Joi.object({
    amount: baseSchemas.currency,
    description: baseSchemas.requiredDescription,
    category: Joi.string().max(100).optional(),
    merchant: Joi.string().trim().max(100).optional(),
    date: baseSchemas.date,
    tags: Joi.array().items(
      Joi.string().max(50).trim().pattern(/^[a-zA-Z0-9_-]+$/)
    ).max(10).unique().optional(),
    receiptUrl: baseSchemas.url,
    notes: Joi.string().max(1000).optional(),
  }),

  update: Joi.object({
    amount: baseSchemas.optionalCurrency,
    description: baseSchemas.description,
    category: Joi.string().max(100).optional(),
    merchant: Joi.string().trim().max(100).optional(),
    date: baseSchemas.optionalDate,
    tags: Joi.array().items(
      Joi.string().max(50).trim().pattern(/^[a-zA-Z0-9_-]+$/)
    ).max(10).unique().optional(),
    receiptUrl: baseSchemas.url,
    notes: Joi.string().max(1000).optional(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().max(100).optional(),
    merchant: Joi.string().max(100).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    amountMin: Joi.number().positive().optional(),
    amountMax: Joi.number().positive().min(Joi.ref('amountMin')).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    search: Joi.string().max(255).optional(),
    sortBy: Joi.string().valid('date', 'amount', 'category', 'merchant', 'description').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
}

// Budget validation schemas
export const budgetSchemas = {
  create: Joi.object({
    name: baseSchemas.name,
    amount: baseSchemas.currency,
    category: Joi.string().max(100).required(),
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly').required(),
    startDate: baseSchemas.date,
    endDate: baseSchemas.futureDate,
    alertThreshold: Joi.number().min(0).max(100).default(80),
    description: baseSchemas.description,
  }),

  update: Joi.object({
    name: baseSchemas.optionalName,
    amount: baseSchemas.optionalCurrency,
    category: Joi.string().max(100).optional(),
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly').optional(),
    startDate: baseSchemas.optionalDate,
    endDate: baseSchemas.optionalDate,
    alertThreshold: Joi.number().min(0).max(100).optional(),
    description: baseSchemas.description,
    isActive: Joi.boolean().optional(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().max(100).optional(),
    period: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly').optional(),
    isActive: Joi.boolean().optional(),
    status: Joi.string().valid('on_track', 'warning', 'over_budget').optional(),
    sortBy: Joi.string().valid('name', 'amount', 'category', 'period', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
}

// Common validation schemas
export const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
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
  ).max(10).unique(),
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

// Analytics validation schemas
export const analyticsSchemas = {
  dashboard: Joi.object({
    period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month'),
    categories: Joi.array().items(Joi.string().max(100)).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  }),

  trends: Joi.object({
    period: Joi.string().valid('week', 'month', 'quarter', 'year').required(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'quarter').required(),
    categories: Joi.array().items(Joi.string().max(100)).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  }),

  comparison: Joi.object({
    currentPeriod: commonSchemas.dateRange,
    previousPeriod: commonSchemas.dateRange,
    groupBy: Joi.string().valid('category', 'merchant', 'day', 'week', 'month').required(),
  }),
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

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long')
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

export const validateFileType = (file: any, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.mimetype)
}

export const validateFileSize = (file: any, maxSize: number): boolean => {
  return file.size <= maxSize
}

export const validateCategory = (category: string, validCategories: string[]): boolean => {
  return validCategories.includes(category)
}

export const validateTags = (tags: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const tagRegex = /^[a-zA-Z0-9_-]+$/

  if (tags.length > 10) {
    errors.push('Maximum of 10 tags allowed')
  }

  const uniqueTags = new Set(tags)
  if (uniqueTags.size !== tags.length) {
    errors.push('Tags must be unique')
  }

  tags.forEach((tag, index) => {
    if (!tag.trim()) {
      errors.push(`Tag ${index + 1} cannot be empty`)
    } else if (tag.length > 50) {
      errors.push(`Tag ${index + 1} must be 50 characters or less`)
    } else if (!tagRegex.test(tag)) {
      errors.push(`Tag ${index + 1} contains invalid characters. Use only letters, numbers, hyphens, and underscores`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
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

// Custom validation functions
export const customValidators = {
  isValidExpenseAmount: (amount: number): boolean => {
    return validateCurrency(amount) && amount <= 999999.99
  },

  isValidBudgetPeriod: (startDate: Date, endDate: Date, period: string): boolean => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    switch (period) {
      case 'weekly':
        return diffDays >= 7 && diffDays <= 14
      case 'monthly':
        return diffDays >= 28 && diffDays <= 31
      case 'quarterly':
        return diffDays >= 89 && diffDays <= 92
      case 'yearly':
        return diffDays >= 365 && diffDays <= 366
      default:
        return false
    }
  },

  isValidDateRange: (startDate: Date, endDate: Date, maxDays: number = 365): boolean => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return startDate <= endDate && diffDays <= maxDays
  },

  isValidPercentage: (value: number): boolean => {
    return Number.isFinite(value) && value >= 0 && value <= 100
  },

  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  },

  isValidCurrencyCode: (code: string): boolean => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL']
    return validCurrencies.includes(code.toUpperCase())
  },
}

// Export all schemas
export const schemas = {
  ...userSchemas,
  ...expenseSchemas,
  ...budgetSchemas,
  ...commonSchemas,
  ...mlSchemas,
  ...fileSchemas,
  ...analyticsSchemas,
}