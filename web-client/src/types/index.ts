export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  userId: string
  amount: number
  description: string
  category: string
  merchant?: string
  date: string
  tags?: string[]
  receipt?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  spent: number
  remaining: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface Analytics {
  totalSpent: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  monthlyTrend: Array<{
    month: string
    amount: number
  }>
  topMerchants: Array<{
    merchant: string
    amount: number
    count: number
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
  createdAt: string
}

export interface ExpenseFormData {
  amount: number
  description: string
  category?: string
  merchant?: string
  date: string
  tags?: string[]
}

export interface AuthFormData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ExpenseFilters = {
  category?: string
  merchant?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  tags?: string[]
}

export type SortOption = {
  field: 'date' | 'amount' | 'category' | 'merchant'
  direction: 'asc' | 'desc'
}

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