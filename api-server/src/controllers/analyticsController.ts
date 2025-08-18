import { Response, NextFunction } from 'express'
import { Expense } from '../models/Expense'
import { AuthenticatedRequest } from '../middleware/auth'
import { catchAsync, createError, sendResponse } from '../middleware/errorHandler'
import { aiService } from '../services/aiService'
import { AnalyticsResponse, CategoryAnalytics, MerchantAnalytics, SpendingTrend, AIInsight } from '../types'

export const getDashboardAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { period = 'month' } = req.query

  const { startDate, endDate } = getDateRange(period as string)

  // Get category breakdown
  const categoryData = await Expense.getAnalytics(userId, startDate, endDate)
  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.totalAmount, 0)

  const categoryBreakdown: CategoryAnalytics[] = categoryData.map(cat => ({
    category: cat._id || 'Uncategorized',
    amount: cat.totalAmount,
    percentage: totalSpent > 0 ? (cat.totalAmount / totalSpent) * 100 : 0,
    count: cat.count,
  }))

  // Get spending trends
  const trendData = await Expense.getSpendingTrends(
    userId,
    startDate,
    endDate,
    period === 'year' ? 'month' : period === 'month' ? 'day' : 'day'
  )

  const monthlyTrend: SpendingTrend[] = trendData.map(trend => ({
    date: trend._id,
    amount: trend.totalAmount,
    count: trend.count,
  }))

  // Get top merchants
  const merchantData = await Expense.getMerchantAnalytics(userId, startDate, endDate)
  const topMerchants: MerchantAnalytics[] = merchantData.map(merchant => ({
    merchant: merchant._id,
    amount: merchant.totalAmount,
    count: merchant.count,
    categories: merchant.categories,
  }))

  const analytics: AnalyticsResponse = {
    totalSpent,
    categoryBreakdown,
    monthlyTrend,
    topMerchants,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: period as 'week' | 'month' | 'year',
    },
  }

  sendResponse(res, 200, 'Analytics retrieved successfully', analytics)
})

export const getCategoryAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { category } = req.params
  const { period = 'month' } = req.query

  const { startDate, endDate } = getDateRange(period as string)

  // Get expenses for specific category
  const expenses = await Expense.find({
    userId,
    category,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 })

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0

  // Get merchant breakdown for this category
  const merchantBreakdown = await Expense.aggregate([
    {
      $match: {
        userId,
        category,
        merchant: { $exists: true, $ne: null },
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$merchant',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
  ])

  // Get daily spending trend for this category
  const dailyTrend = await Expense.aggregate([
    {
      $match: {
        userId,
        category,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const analytics = {
    category,
    totalAmount,
    avgAmount,
    transactionCount: expenses.length,
    merchantBreakdown: merchantBreakdown.map(merchant => ({
      merchant: merchant._id,
      amount: merchant.totalAmount,
      count: merchant.count,
      percentage: (merchant.totalAmount / totalAmount) * 100,
    })),
    dailyTrend: dailyTrend.map(day => ({
      date: day._id,
      amount: day.amount,
      count: day.count,
    })),
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: period as 'week' | 'month' | 'year',
    },
  }

  sendResponse(res, 200, 'Category analytics retrieved successfully', analytics)
})

export const getSpendingTrends = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { period = 'month', category } = req.query

  const { startDate, endDate } = getDateRange(period as string)

  const matchConditions: any = {
    userId,
    date: { $gte: startDate, $lte: endDate },
  }

  if (category) {
    matchConditions.category = category
  }

  const groupBy = period === 'year' ? 'month' : period === 'month' ? 'day' : 'day'
  let dateFormat: string

  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d'
      break
    case 'month':
      dateFormat = '%Y-%m'
      break
    default:
      dateFormat = '%Y-%m-%d'
  }

  const trends = await Expense.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$date' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const trendData: SpendingTrend[] = trends.map(trend => ({
    date: trend._id,
    amount: trend.amount,
    count: trend.count,
  }))

  sendResponse(res, 200, 'Spending trends retrieved successfully', trendData)
})

export const getInsights = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    // Get recent expenses for AI analysis
    const recentExpenses = await Expense.find({ userId })
      .sort({ date: -1 })
      .limit(100)

    // Get insights from AI service
    const insights = await aiService.generateInsights(userId, recentExpenses)

    sendResponse(res, 200, 'Insights retrieved successfully', insights)
  } catch (error) {
    console.error('Failed to generate insights:', error)

    // Fallback to basic insights
    const basicInsights = await generateBasicInsights(userId)
    sendResponse(res, 200, 'Basic insights retrieved successfully', basicInsights)
  }
})

export const getComparativeAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { period = 'month' } = req.query

  const currentPeriod = getDateRange(period as string)
  const previousPeriod = getPreviousDateRange(period as string)

  // Get current period data
  const currentData = await Expense.getAnalytics(userId, currentPeriod.startDate, currentPeriod.endDate)
  const currentTotal = currentData.reduce((sum, cat) => sum + cat.totalAmount, 0)

  // Get previous period data
  const previousData = await Expense.getAnalytics(userId, previousPeriod.startDate, previousPeriod.endDate)
  const previousTotal = previousData.reduce((sum, cat) => sum + cat.totalAmount, 0)

  // Calculate changes
  const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  const categoryComparison = currentData.map(current => {
    const previous = previousData.find(p => p._id === current._id)
    const previousAmount = previous ? previous.totalAmount : 0
    const change = previousAmount > 0 ? ((current.totalAmount - previousAmount) / previousAmount) * 100 : 0

    return {
      category: current._id || 'Uncategorized',
      currentAmount: current.totalAmount,
      previousAmount,
      change,
      changeAmount: current.totalAmount - previousAmount,
    }
  })

  const comparison = {
    currentPeriod: {
      total: currentTotal,
      start: currentPeriod.startDate.toISOString(),
      end: currentPeriod.endDate.toISOString(),
    },
    previousPeriod: {
      total: previousTotal,
      start: previousPeriod.startDate.toISOString(),
      end: previousPeriod.endDate.toISOString(),
    },
    totalChange,
    totalChangeAmount: currentTotal - previousTotal,
    categoryComparison,
  }

  sendResponse(res, 200, 'Comparative analytics retrieved successfully', comparison)
})

export const getMonthlyReport = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { year, month } = req.query

  const reportDate = new Date(Number(year), Number(month) - 1, 1)
  const startDate = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1)
  const endDate = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0)

  // Get all data for the month
  const [categoryData, merchantData, dailyData] = await Promise.all([
    Expense.getAnalytics(userId, startDate, endDate),
    Expense.getMerchantAnalytics(userId, startDate, endDate),
    Expense.getSpendingTrends(userId, startDate, endDate, 'day'),
  ])

  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.totalAmount, 0)
  const totalTransactions = categoryData.reduce((sum, cat) => sum + cat.count, 0)
  const avgTransactionAmount = totalTransactions > 0 ? totalSpent / totalTransactions : 0

  // Find highest and lowest spending days
  const sortedDays = dailyData.sort((a, b) => b.totalAmount - a.totalAmount)
  const highestSpendingDay = sortedDays[0]
  const lowestSpendingDay = sortedDays[sortedDays.length - 1]

  const report = {
    period: {
      year: reportDate.getFullYear(),
      month: reportDate.getMonth() + 1,
      monthName: reportDate.toLocaleString('default', { month: 'long' }),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      totalSpent,
      totalTransactions,
      avgTransactionAmount,
      daysWithSpending: dailyData.length,
      categoriesUsed: categoryData.length,
      merchantsVisited: merchantData.length,
    },
    topCategories: categoryData.slice(0, 5).map(cat => ({
      category: cat._id || 'Uncategorized',
      amount: cat.totalAmount,
      percentage: (cat.totalAmount / totalSpent) * 100,
      transactionCount: cat.count,
    })),
    topMerchants: merchantData.slice(0, 5).map(merchant => ({
      merchant: merchant._id,
      amount: merchant.totalAmount,
      transactionCount: merchant.count,
      categories: merchant.categories,
    })),
    spendingPattern: {
      highestSpendingDay: highestSpendingDay ? {
        date: highestSpendingDay._id,
        amount: highestSpendingDay.totalAmount,
      } : null,
      lowestSpendingDay: lowestSpendingDay ? {
        date: lowestSpendingDay._id,
        amount: lowestSpendingDay.totalAmount,
      } : null,
      dailyAverage: totalSpent / new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0).getDate(),
    },
    dailyBreakdown: dailyData.map(day => ({
      date: day._id,
      amount: day.totalAmount,
      transactionCount: day.count,
    })),
  }

  sendResponse(res, 200, 'Monthly report generated successfully', report)
})

// Helper functions
function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date()
  const endDate = new Date()

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setMonth(now.getMonth() - 1)
  }

  return { startDate, endDate }
}

function getPreviousDateRange(period: string): { startDate: Date; endDate: Date } {
  const current = getDateRange(period)
  const startDate = new Date(current.startDate)
  const endDate = new Date(current.endDate)

  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7)
      endDate.setDate(endDate.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1)
      endDate.setMonth(endDate.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1)
      endDate.setFullYear(endDate.getFullYear() - 1)
      break
  }

  return { startDate, endDate }
}

async function generateBasicInsights(userId: string): Promise<AIInsight[]> {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisMonthData, lastMonthData] = await Promise.all([
    Expense.getAnalytics(userId, thisMonth, now),
    Expense.getAnalytics(userId, lastMonth, thisMonth),
  ])

  const insights: AIInsight[] = []

  // Compare spending
  const thisMonthTotal = thisMonthData.reduce((sum, cat) => sum + cat.totalAmount, 0)
  const lastMonthTotal = lastMonthData.reduce((sum, cat) => sum + cat.totalAmount, 0)

  if (lastMonthTotal > 0) {
    const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

    if (change > 20) {
      insights.push({
        id: `spending-increase-${Date.now()}`,
        type: 'warning',
        title: 'Spending Increase Detected',
        description: `Your spending has increased by ${change.toFixed(1)}% compared to last month.`,
        impact: 'high',
        actionable: true,
        createdAt: new Date().toISOString(),
      })
    } else if (change < -10) {
      insights.push({
        id: `spending-decrease-${Date.now()}`,
        type: 'achievement',
        title: 'Great Job Saving!',
        description: `You've reduced your spending by ${Math.abs(change).toFixed(1)}% this month.`,
        impact: 'medium',
        actionable: false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // Top category insight
  const topCategory = thisMonthData[0]
  if (topCategory) {
    insights.push({
      id: `top-category-${Date.now()}`,
      type: 'tip',
      title: `${topCategory._id} is your top expense`,
      description: `You've spent $${topCategory.totalAmount.toFixed(2)} on ${topCategory._id} this month.`,
      category: topCategory._id,
      impact: 'low',
      actionable: true,
      createdAt: new Date().toISOString(),
    })
  }

  return insights
}