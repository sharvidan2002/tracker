export interface Budget {
  id: string
  userId: string
  name: string
  category?: string
  amount: number
  spent: number
  remaining: number
  period: BudgetPeriod
  startDate: Date
  endDate: Date
  isActive: boolean
  alertThreshold: number
  alertsEnabled: boolean
  rollover: boolean
  tags?: string[]
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateBudgetRequest {
  name: string
  category?: string
  amount: number
  period: BudgetPeriod
  alertThreshold?: number
  alertsEnabled?: boolean
  rollover?: boolean
  tags?: string[]
  description?: string
  startDate?: string
}

export interface UpdateBudgetRequest {
  name?: string
  amount?: number
  period?: BudgetPeriod
  alertThreshold?: number
  alertsEnabled?: boolean
  rollover?: boolean
  tags?: string[]
  description?: string
  isActive?: boolean
}

export interface BudgetFilters {
  period?: BudgetPeriod
  category?: string
  isActive?: boolean
  tags?: string[]
  alertStatus?: 'ok' | 'warning' | 'exceeded'
}

export interface BudgetSummary {
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
  budgetCount: number
  activeBudgets: number
  exceededBudgets: number
  warningBudgets: number
  onTrackBudgets: number
  averageUtilization: number
}

export interface BudgetPerformance {
  budgetId: string
  name: string
  category?: string
  period: BudgetPeriod
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  utilizationPercentage: number
  dailyAverage: number
  projectedSpending: number
  status: BudgetStatus
  daysRemaining: number
  dailyBudgetRemaining: number
  trend: BudgetTrend
  history: BudgetHistoryEntry[]
}

export interface BudgetHistoryEntry {
  date: string
  spent: number
  cumulativeSpent: number
  dailyLimit: number
  isOnTrack: boolean
}

export interface BudgetAlert {
  id: string
  budgetId: string
  userId: string
  type: BudgetAlertType
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  threshold: number
  currentAmount: number
  budgetAmount: number
  isRead: boolean
  isActive: boolean
  triggeredAt: Date
  dismissedAt?: Date
  createdAt: Date
}

export interface BudgetGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  category?: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  isActive: boolean
  isAchieved: boolean
  achievedAt?: Date
  milestones: BudgetMilestone[]
  createdAt: Date
  updatedAt: Date
}

export interface BudgetMilestone {
  id: string
  goalId: string
  name: string
  targetAmount: number
  targetDate: Date
  isAchieved: boolean
  achievedAt?: Date
  reward?: string
}

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  category: string
  budgets: BudgetTemplateItem[]
  tags?: string[]
  isPublic: boolean
  userId?: string
  createdAt: Date
  updatedAt: Date
}

export interface BudgetTemplateItem {
  name: string
  category: string
  percentage: number
  amount?: number
  period: BudgetPeriod
  alertThreshold: number
}

export interface BudgetRecommendation {
  id: string
  type: 'increase' | 'decrease' | 'create' | 'remove'
  category?: string
  currentAmount?: number
  recommendedAmount: number
  reason: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  basedOn: string[]
  createdAt: Date
}

export interface BudgetAnalytics {
  period: {
    start: string
    end: string
    type: BudgetPeriod
  }
  summary: BudgetSummary
  performance: BudgetPerformance[]
  trends: BudgetTrendData[]
  recommendations: BudgetRecommendation[]
  alerts: BudgetAlert[]
  insights: BudgetInsight[]
}

export interface BudgetTrendData {
  date: string
  budgeted: number
  spent: number
  remaining: number
  categories: Array<{
    category: string
    budgeted: number
    spent: number
  }>
}

export interface BudgetInsight {
  id: string
  type: 'success' | 'warning' | 'tip' | 'achievement'
  title: string
  description: string
  category?: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  data?: Record<string, any>
  createdAt: Date
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type BudgetStatus =
  | 'on_track'     // Under 50% utilization
  | 'good'         // 50-75% utilization
  | 'warning'      // 75-100% utilization
  | 'exceeded'     // Over 100% utilization
  | 'critical'     // Significantly over budget

export type BudgetTrend =
  | 'improving'    // Spending is decreasing
  | 'stable'       // Spending is consistent
  | 'increasing'   // Spending is increasing
  | 'volatile'     // Spending is erratic

export type BudgetAlertType =
  | 'approaching_limit'  // Near threshold
  | 'exceeded_budget'    // Over budget
  | 'milestone_reached'  // Goal milestone
  | 'period_ending'      // Budget period ending
  | 'unusual_spending'   // Anomaly detected

export const BUDGET_PERIODS: Array<{ value: BudgetPeriod; label: string; days: number }> = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'quarterly', label: 'Quarterly', days: 90 },
  { value: 'yearly', label: 'Yearly', days: 365 },
  { value: 'custom', label: 'Custom', days: 0 },
]

export const DEFAULT_ALERT_THRESHOLDS = {
  warning: 75,
  critical: 90,
  exceeded: 100,
} as const