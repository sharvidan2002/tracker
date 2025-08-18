// Generic API Response Structure
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: ValidationError[]
  meta?: ResponseMeta
}

// Paginated Response Structure
export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: PaginationMeta
  meta?: ResponseMeta
}

// Pagination Metadata
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number
  prevPage?: number
}

// Response Metadata
export interface ResponseMeta {
  timestamp: string
  requestId?: string
  version?: string
  processingTime?: number
  cached?: boolean
  rateLimit?: RateLimitInfo
}

// Rate Limiting Information
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Validation Error Structure
export interface ValidationError {
  field: string
  message: string
  code?: string
  value?: any
}

// API Error Response
export interface ApiError {
  success: false
  message: string
  error: string
  statusCode: number
  errors?: ValidationError[]
  stack?: string
  meta?: ResponseMeta
}

// Search/Filter Parameters
export interface SearchParams {
  query?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

// Sort Configuration
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Filter Configuration
export interface FilterConfig {
  field: string
  operator: FilterOperator
  value: any
  type?: 'string' | 'number' | 'date' | 'boolean'
}

export type FilterOperator =
  | 'eq'          // equals
  | 'ne'          // not equals
  | 'gt'          // greater than
  | 'gte'         // greater than or equal
  | 'lt'          // less than
  | 'lte'         // less than or equal
  | 'in'          // in array
  | 'nin'         // not in array
  | 'contains'    // string contains
  | 'startsWith'  // string starts with
  | 'endsWith'    // string ends with
  | 'regex'       // regex match
  | 'between'     // between two values
  | 'exists'      // field exists
  | 'null'        // field is null

// Batch Operations
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete'
  data: T | T[]
  options?: OperationOptions
}

export interface BatchResponse<T> {
  success: boolean
  message: string
  results: BatchResult<T>[]
  summary: BatchSummary
}

export interface BatchResult<T> {
  success: boolean
  data?: T
  error?: string
  id?: string
  index: number
}

export interface BatchSummary {
  total: number
  successful: number
  failed: number
  skipped: number
  processingTime: number
}

// Operation Options
export interface OperationOptions {
  dryRun?: boolean
  validate?: boolean
  skipDuplicates?: boolean
  continueOnError?: boolean
  timeout?: number
}

// File Upload Response
export interface FileUploadResponse {
  success: boolean
  message: string
  data: {
    filename: string
    originalName: string
    size: number
    mimetype: string
    url: string
    path: string
    metadata?: Record<string, any>
  }
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: ServiceHealth[]
  metrics?: SystemMetrics
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  lastChecked: string
  error?: string
}

export interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  connections: {
    active: number
    total: number
  }
}

// Analytics/Metrics Response
export interface MetricsResponse {
  period: {
    start: string
    end: string
    duration: string
  }
  metrics: Metric[]
  aggregations?: Record<string, number>
  trends?: TrendData[]
}

export interface Metric {
  name: string
  value: number
  unit?: string
  timestamp: string
  tags?: Record<string, string>
}

export interface TrendData {
  timestamp: string
  value: number
  change?: number
  changePercentage?: number
}

// WebSocket Message Types
export interface WebSocketMessage<T = any> {
  type: string
  event: string
  data: T
  timestamp: string
  id?: string
  userId?: string
}

export interface WebSocketResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  requestId?: string
}

// Real-time Event Types
export type RealtimeEvent =
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'budget_alert'
  | 'budget_exceeded'
  | 'goal_achieved'
  | 'insight_generated'
  | 'report_ready'
  | 'sync_completed'

// API Endpoints Configuration
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  authenticated: boolean
  rateLimited: boolean
  cached: boolean
  timeout: number
}

// Request Context
export interface RequestContext {
  userId?: string
  sessionId?: string
  requestId: string
  userAgent?: string
  ipAddress?: string
  timestamp: string
  route: string
  method: string
}

// Export/Import Types
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  filters?: Record<string, any>
  fields?: string[]
  options?: ExportOptions
}

export interface ExportOptions {
  includeHeaders?: boolean
  dateFormat?: string
  currencyFormat?: string
  timezone?: string
  filename?: string
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
}

// Notification Types
export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  data?: Record<string, any>
  actions?: NotificationAction[]
  ttl?: number
}

export interface NotificationAction {
  label: string
  action: string
  data?: Record<string, any>
  style?: 'primary' | 'secondary' | 'danger'
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
}