import { useQuery } from 'react-query'
import { Analytics, AIInsight } from '../types'
import { expenseService } from '../services/expenses'
import { QUERY_KEYS } from '../utils/constants'

export const useAnalytics = (period: 'week' | 'month' | 'year' = 'month') => {
  return useQuery<Analytics, Error>(
    [QUERY_KEYS.ANALYTICS, period],
    () => expenseService.getExpenseAnalytics(period),
    {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
    }
  )
}

export const useSpendingTrends = (period: 'week' | 'month' | 'year' = 'month') => {
  return useQuery<Array<{ date: string; amount: number }>, Error>(
    [QUERY_KEYS.ANALYTICS, 'trends', period],
    () => expenseService.getSpendingTrends(period),
    {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
    }
  )
}

export const useAIInsights = () => {
  return useQuery<AIInsight[], Error>(
    [QUERY_KEYS.INSIGHTS],
    expenseService.getAIInsights,
    {
      staleTime: 300000, // 5 minutes
      cacheTime: 600000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  )
}

// Custom hook for dashboard data that combines multiple analytics
export const useDashboardData = (period: 'week' | 'month' | 'year' = 'month') => {
  const analytics = useAnalytics(period)
  const trends = useSpendingTrends(period)
  const insights = useAIInsights()

  return {
    analytics,
    trends,
    insights,
    isLoading: analytics.isLoading || trends.isLoading || insights.isLoading,
    isError: analytics.isError || trends.isError || insights.isError,
    error: analytics.error || trends.error || insights.error,
  }
}

// Hook for category-specific analytics
export const useCategoryAnalytics = (category: string, period: 'week' | 'month' | 'year' = 'month') => {
  return useQuery<Analytics, Error>(
    [QUERY_KEYS.ANALYTICS, 'category', category, period],
    () => expenseService.getExpenseAnalytics(period),
    {
      staleTime: 60000,
      select: (data) => ({
        ...data,
        categoryBreakdown: data.categoryBreakdown.filter(item => item.category === category),
      }),
    }
  )
}