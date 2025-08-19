// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ErrorResponse {
  success: false
  message: string
  error?: string
  details?: string[]
  code?: string
  timestamp: string
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    isEmailVerified: boolean
    createdAt: string
    updatedAt: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// User Types
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  currency?: string
  timezone?: string
  language?: string
  notifications?: {
    email: boolean
    push: boolean
    sms: boolean
    budgetAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
  }
}

export interface UserPreferences {
  currency: string
  timezone: string
  language: string
  dateFormat: string
  numberFormat: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    budgetAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
  }
  privacy: {
    shareData: boolean
    profileVisibility: 'public' | 'private' | 'friends'
  }
}

// Expense Types
export interface CreateExpenseRequest {
  amount: number
  description: string
  category?: string
  merchant?: string
  date: string
  tags?: string[]
  receiptUrls?: string[]
  notes?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  paymentMethod?: string
  isRecurring?: boolean
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
    maxOccurrences?: number
  }
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: string
}

export interface ExpenseQueryParams {
  page?: number
  limit?: number
  category?: string
  merchant?: string
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  tags?: string[]
  search?: string
  sortBy?: 'date' | 'amount' | 'category' | 'merchant' | 'description'
  sortOrder?: 'asc' | 'desc'
  includeRecurring?: boolean
  status?: 'pending' | 'approved' | 'rejected'
  paymentMethod?: string
}

export interface CategorizeExpenseRequest {
  description: string
  merchant?: string
  amount?: number
}

export interface CategorizeExpenseResponse {
  category: string
  confidence: number
  suggestions: Array<{
    category: string
    confidence: number
  }>
}

export interface BulkCategorizeRequest {
  expenses: Array<{
    id: string
    description: string
    merchant?: string
    amount?: number
  }>
}

export interface BulkCategorizeResponse {
  results: Array<{
    id: string
    category: string
    confidence: number
    suggestions: Array<{
      category: string
      confidence: number
    }>
  }>
}

// Budget Types
export interface CreateBudgetRequest {
  name: string
  amount: number
  category: string
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  alertThreshold?: number
  description?: string
  tags?: string[]
  isShared?: boolean
  sharedWith?: string[]
}

export interface UpdateBudgetRequest extends Partial<CreateBudgetRequest> {
  id: string
  isActive?: boolean
}

export interface BudgetQueryParams {
  page?: number
  limit?: number
  category?: string
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  isActive?: boolean
  status?: 'on_track' | 'warning' | 'over_budget'
  sortBy?: 'name' | 'amount' | 'category' | 'period' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  includeShared?: boolean
}

export interface BudgetStatus {
  status: 'on_track' | 'warning' | 'over_budget'
  usagePercentage: number
  remainingAmount: number
  daysRemaining: number
  dailyBudgetRemaining: number
  projectedEndAmount?: number
}

// Analytics Types
export interface AnalyticsQueryParams {
  period?: 'week' | 'month' | 'quarter' | 'year'
  dateFrom?: string
  dateTo?: string
  categories?: string[]
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'category' | 'merchant'
  includeForecasts?: boolean
}

export interface DashboardAnalytics {
  totalExpenses: number
  totalAmount: number
  averageExpense: number
  expenseCount: number
  topCategories: Array<{
    category: string
    amount: number
    count: number
    percentage: number
  }>
  topMerchants: Array<{
    merchant: string
    amount: number
    count: number
    category: string
  }>
  dailyAverage: number
  weeklyAverage: number
  monthlyAverage: number
  trends: {
    amountChange: number
    countChange: number
    averageChange: number
    period: string
  }
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    budget?: number
    budgetUsage?: number
  }>
  monthlyTrends: Array<{
    month: string
    amount: number
    count: number
    categories: Record<string, number>
  }>
}

export interface SpendingTrends {
  datasets: Array<{
    label: string
    data: Array<{
      date: string
      amount: number
      count: number
    }>
    trend: 'increasing' | 'decreasing' | 'stable'
    changePercentage: number
  }>
  predictions?: Array<{
    date: string
    predictedAmount: number
    confidence: number
  }>
}

// Import/Export Types
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  filters?: ExpenseQueryParams
  fields?: string[]
  options?: ExportOptions
}

export interface ExportOptions {
  includeHeaders?: boolean
  dateFormat?: string
  currencyFormat?: string
  timezone?: string
  filename?: string
  template?: string
  includeBudgets?: boolean
  includeAnalytics?: boolean
}

export interface ImportRequest {
  format: 'csv' | 'xlsx' | 'json'
  file: File | string
  mapping: Record<string, string>
  options?: ImportOptions
}

export interface ImportOptions {
  skipHeader?: boolean
  delimiter?: string
  dateFormat?: string
  currencyFormat?: string
  dryRun?: boolean
  duplicateHandling?: 'skip' | 'update' | 'create'
  categoryMapping?: Record<string, string>
  merchantMapping?: Record<string, string>
  validateOnly?: boolean
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: number
  details: {
    importedExpenses: string[]
    skippedExpenses: Array<{
      row: number
      reason: string
      data: any
    }>
    errorExpenses: Array<{
      row: number
      error: string
      data: any
    }>
  }
  summary: {
    totalAmount: number
    categoriesByCount: Record<string, number>
    merchantsByCount: Record<string, number>
    dateRange: {
      earliest: string
      latest: string
    }
  }
}

// File Upload Types
export interface FileUploadRequest {
  files: File[]
  type: 'receipt' | 'import' | 'profile'
  metadata?: Record<string, any>
}

export interface FileUploadResponse {
  success: boolean
  files: Array<{
    filename: string
    originalName: string
    size: number
    url: string
    type: string
    metadata?: Record<string, any>
  }>
  errors?: Array<{
    filename: string
    error: string
  }>
}

// Notification Types
export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  ttl?: number
  targetUsers?: string[]
  channels?: ('email' | 'push' | 'sms')[]
}

export interface NotificationAction {
  label: string
  action: string
  data?: Record<string, any>
  style?: 'primary' | 'secondary' | 'danger'
  url?: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  categories: {
    budgetAlerts: boolean
    weeklyReports: boolean
    monthlyReports: boolean
    expenseReminders: boolean
    securityAlerts: boolean
    systemUpdates: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
}

// Search Types
export interface AdvancedSearchRequest {
  query: string
  filters: {
    categories?: string[]
    merchants?: string[]
    amountRange?: {
      min: number
      max: number
    }
    dateRange?: {
      start: string
      end: string
    }
    tags?: string[]
    paymentMethods?: string[]
    hasReceipts?: boolean
    isRecurring?: boolean
    status?: ('pending' | 'approved' | 'rejected')[]
  }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  fuzzy?: boolean
  highlights?: boolean
}

export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
  executionTime: number
  suggestions?: string[]
  facets?: {
    categories: Record<string, number>
    merchants: Record<string, number>
    tags: Record<string, number>
    paymentMethods: Record<string, number>
  }
}

// Webhook Types
export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  signature: string
  userId?: string
}

export interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  headers?: Record<string, string>
  retryConfig?: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
}

// API Metadata Types
export interface ApiMetadata {
  version: string
  build: string
  environment: string
  features: string[]
  limits: {
    rateLimit: {
      requests: number
      window: string
    }
    fileUpload: {
      maxSize: number
      allowedTypes: string[]
    }
    export: {
      maxRecords: number
      allowedFormats: string[]
    }
  }
  endpoints: Array<{
    path: string
    methods: string[]
    description: string
    deprecated?: boolean
  }>
}

// Audit Log Types
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
  sessionId?: string
  requestId: string
}

export interface AuditLogQuery {
  userId?: string
  action?: string
  resource?: string
  dateFrom?: string
  dateTo?: string
  ipAddress?: string
  page?: number
  limit?: number
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime: number
      details?: string
    }
    redis: {
      status: 'up' | 'down'
      responseTime: number
      details?: string
    }
    mlService: {
      status: 'up' | 'down'
      responseTime: number
      details?: string
    }
    externalApis: Array<{
      name: string
      status: 'up' | 'down'
      responseTime: number
      details?: string
    }>
  }
  metrics: {
    requests: {
      total: number
      success: number
      errors: number
      averageResponseTime: number
    }
    memory: {
      used: number
      free: number
      total: number
    }
    cpu: {
      usage: number
      load: number[]
    }
  }
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
}

// Cache Types
export interface CacheConfig {
  ttl: number
  key: string
  tags?: string[]
  condition?: (req: any, res: any) => boolean
}

export interface CacheInfo {
  hit: boolean
  key: string
  ttl: number
  createdAt: string
  tags?: string[]
}

// Batch Operation Types
export interface BatchRequest<T> {
  operations: Array<{
    method: 'CREATE' | 'UPDATE' | 'DELETE'
    resource: string
    data: T
    id?: string
  }>
  options?: {
    continueOnError: boolean
    validateOnly: boolean
    transactional: boolean
  }
}

export interface BatchResponse<T> {
  success: boolean
  results: Array<{
    success: boolean
    data?: T
    error?: string
    operation: {
      method: string
      resource: string
      id?: string
    }
  }>
  summary: {
    total: number
    successful: number
    failed: number
    skipped: number
  }
}