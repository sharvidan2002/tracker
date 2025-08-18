export interface Expense {
  id: string
  userId: string
  amount: number
  description: string
  category?: string
  merchant?: string
  date: Date
  tags?: string[]
  receipt?: string
  location?: ExpenseLocation
  paymentMethod?: PaymentMethod
  isRecurring?: boolean
  recurringId?: string
  metadata?: ExpenseMetadata
  createdAt: Date
  updatedAt: Date
}

export interface ExpenseLocation {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  country?: string
}

export interface ExpenseMetadata {
  source: 'manual' | 'imported' | 'api' | 'recurring'
  confidence?: number
  originalDescription?: string
  importedFrom?: string
  categorizedBy?: 'user' | 'ai' | 'rules'
  duplicateOf?: string
  notes?: string
}

export interface CreateExpenseRequest {
  amount: number
  description: string
  category?: string
  merchant?: string
  date: string
  tags?: string[]
  paymentMethod?: PaymentMethod
  location?: ExpenseLocation
  isRecurring?: boolean
  recurringPattern?: RecurringPattern
}

export interface UpdateExpenseRequest {
  amount?: number
  description?: string
  category?: string
  merchant?: string
  date?: string
  tags?: string[]
  paymentMethod?: PaymentMethod
  location?: ExpenseLocation
}

export interface ExpenseFilters {
  category?: string
  merchant?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  tags?: string[]
  paymentMethod?: PaymentMethod
  hasReceipt?: boolean
  isRecurring?: boolean
  location?: {
    latitude: number
    longitude: number
    radius: number // in kilometers
  }
}

export interface ExpenseSearchParams extends ExpenseFilters {
  query?: string
  page?: number
  limit?: number
  sortBy?: ExpenseSortField
  sortOrder?: 'asc' | 'desc'
}

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  parentId?: string
  isDefault: boolean
  isActive: boolean
  keywords?: string[]
  rules?: CategoryRule[]
}

export interface CategoryRule {
  field: 'description' | 'merchant' | 'amount'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'greaterThan' | 'lessThan'
  value: string | number
  caseSensitive?: boolean
}

export interface ExpenseSummary {
  totalAmount: number
  transactionCount: number
  averageAmount: number
  categoryBreakdown: CategorySummary[]
  merchantBreakdown: MerchantSummary[]
  dailySummary: DailySummary[]
  period: {
    start: string
    end: string
    days: number
  }
}

export interface CategorySummary {
  category: string
  amount: number
  count: number
  percentage: number
  averageAmount: number
}

export interface MerchantSummary {
  merchant: string
  amount: number
  count: number
  categories: string[]
  averageAmount: number
}

export interface DailySummary {
  date: string
  amount: number
  count: number
  categories: string[]
}

export interface RecurringExpense {
  id: string
  userId: string
  templateExpense: Omit<CreateExpenseRequest, 'date'>
  pattern: RecurringPattern
  nextDate: Date
  lastCreated?: Date
  isActive: boolean
  createdCount: number
  maxOccurrences?: number
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // every N frequency units
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  monthOfYear?: number // 1-12 for yearly
  endAfter?: {
    occurrences?: number
    date?: string
  }
}

export interface ExpenseImport {
  id: string
  userId: string
  fileName: string
  fileSize: number
  source: 'csv' | 'bank' | 'creditCard' | 'manual'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRows: number
  processedRows: number
  successfulRows: number
  failedRows: number
  errors?: ImportError[]
  mapping?: FieldMapping
  preview?: ExpensePreview[]
  createdAt: Date
  updatedAt: Date
}

export interface ImportError {
  row: number
  field?: string
  error: string
  value?: any
}

export interface FieldMapping {
  amount: string
  description: string
  date: string
  category?: string
  merchant?: string
  tags?: string
}

export interface ExpensePreview {
  row: number
  amount?: number
  description?: string
  date?: string
  category?: string
  merchant?: string
  tags?: string[]
  isValid: boolean
  errors?: string[]
}

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'venmo'
  | 'apple_pay'
  | 'google_pay'
  | 'cryptocurrency'
  | 'check'
  | 'other'

export type ExpenseSortField =
  | 'date'
  | 'amount'
  | 'description'
  | 'category'
  | 'merchant'
  | 'createdAt'
  | 'updatedAt'

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
  'Investment',
  'Insurance',
  'Taxes',
  'Other'
] as const

export type DefaultExpenseCategory = typeof EXPENSE_CATEGORIES[number]