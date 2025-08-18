// User types
export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  user: UserResponse
  token: string
  refreshToken?: string
}

// Expense types
export interface ExpenseResponse {
  id: string
  userId: string
  amount: number
  description: string
  category?: string
  merchant?: string
  date: string
  tags?: string[]
  receipt?: string
  metadata?: {
    source?: 'manual' | 'imported' | 'api'
    confidence?: number
    originalDescription?: string
    location?: {
      latitude: number
      longitude: number
      address?: string
    }
  }
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseRequest {
  amount: number
  description: string
  category?: string
  merchant?: string
  date: string
  tags?: string[]
}

export interface UpdateExpenseRequest {
  amount?: number
  description?: string
  category?: string
  merchant?: string
  date?: string
  tags?: string[]
}

export interface ExpenseFilters {
  category?: string
  merchant?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  tags?: string[]
  search?: string
}

export interface ExpenseQuery extends ExpenseFilters {
  page?: number
  limit?: number
  sortBy?: 'date' | 'amount' | 'category' | 'merchant'
  sortOrder?: 'asc' | 'desc'
}

// Budget types
export interface BudgetResponse {
  id: string
  userId: string
  category: string
  amount: number
  spent: number
  remaining: number
  period: 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate: string
  isActive: boolean
  alertThreshold: number
  createdAt: string
  updatedAt: string
}

export interface CreateBudgetRequest {
  category: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  alertThreshold?: number
}

export interface UpdateBudgetRequest {
  amount?: number
  period?: 'weekly' | 'monthly' | 'yearly'
  alertThreshold?: number
  isActive?: boolean
}

// Analytics types
export interface CategoryAnalytics {
  category: string
  amount: number
  percentage: number
  count: number
}

export interface MerchantAnalytics {
  merchant: string
  amount: number
  count: number
  categories: string[]
}

export interface SpendingTrend {
  date: string
  amount: number
  count: number
}

export interface AnalyticsResponse {
  totalSpent: number
  categoryBreakdown: CategoryAnalytics[]
  monthlyTrend: SpendingTrend[]
  topMerchants: MerchantAnalytics[]
  period: {
    start: string
    end: string
    type: 'week' | 'month' | 'year'
  }
}

// AI/ML types
export interface CategorizeRequest {
  description: string
  merchant?: string
}

export interface CategorizeResponse {
  category: string
  confidence: number
}

export interface BulkCategorizeRequest {
  expenses: Array<{
    id: string
    description: string
    merchant?: string
  }>
}

export interface BulkCategorizeResponse {
  results: Array<{
    id: string
    category: string
    confidence: number
  }>
}

export interface AIInsight {
  id: string
  type: 'tip' | 'warning' | 'achievement' | 'recommendation'
  title: string
  description: string
  category?: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  data?: Record<string, any>
  createdAt: string
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{
    field: string
    message: string
  }>
}

// Error types
export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ApiError {
  statusCode: number
  message: string
  errors?: ValidationError[]
  stack?: string
}

// File upload types
export interface UploadResponse {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
}

// Query builder types
export interface QueryOptions {
  where?: Record<string, any>
  include?: any[]
  order?: Array<[string, 'ASC' | 'DESC']>
  limit?: number
  offset?: number
  attributes?: string[]
}

// Date range types
export interface DateRange {
  start: Date
  end: Date
}

export interface PeriodQuery {
  period?: 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}

// Categories and constants
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Business',
  'Other'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export const BUDGET_PERIODS = ['weekly', 'monthly', 'yearly'] as const
export type BudgetPeriod = typeof BUDGET_PERIODS[number]

export const SORT_FIELDS = ['date', 'amount', 'category', 'merchant'] as const
export type SortField = typeof SORT_FIELDS[number]

export const SORT_ORDERS = ['asc', 'desc'] as const
export type SortOrder = typeof SORT_ORDERS[number]

// Request context types
export interface RequestContext {
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  requestId?: string
  ip?: string
  userAgent?: string
}

// Service response types
export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: ValidationError[]
}

// External API types
export interface MLServiceResponse {
  category: string
  confidence: number
  suggestions?: string[]
}

export interface GeminiResponse {
  insights: AIInsight[]
  recommendations: string[]
}