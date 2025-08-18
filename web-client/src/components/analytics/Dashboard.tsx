import React, { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Lightbulb } from 'lucide-react'
import { useDashboardData } from '../../hooks/useAnalytics'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import SpendingChart from './SpendingChart'
import CategoryChart from './CategoryChart'
import BudgetTracker from './BudgetTracker'
import { formatCurrency, formatPercentage } from '../../utils/formatters'

interface DashboardProps {
  period?: 'week' | 'month' | 'year'
}

const Dashboard: React.FC<DashboardProps> = ({ period: defaultPeriod = 'month' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>(defaultPeriod)

  const { analytics, trends, insights, isLoading, isError } = useDashboardData(selectedPeriod)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load analytics data</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  const analyticsData = analytics.data
  const trendsData = trends.data || []
  const insightsData = insights.data || []

  // Calculate trend
  const currentPeriodSpending = analyticsData?.totalSpent || 0
  const previousPeriodSpending = trendsData.length >= 2 ? trendsData[trendsData.length - 2].amount : 0
  const spendingChange = previousPeriodSpending ? ((currentPeriodSpending - previousPeriodSpending) / previousPeriodSpending) * 100 : 0

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your spending patterns and insights</p>
        </div>

        <div className="flex items-center space-x-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedPeriod(period.value as any)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentPeriodSpending)}
              </p>
              {spendingChange !== 0 && (
                <p className={`text-sm flex items-center mt-1 ${spendingChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {spendingChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(Math.abs(spendingChange))} vs last {selectedPeriod}
                </p>
              )}
            </div>
            <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.categoryBreakdown.reduce((sum, cat) => sum + (cat as any).count || 0, 0) || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Avg: {formatCurrency(currentPeriodSpending / Math.max(1, analyticsData?.categoryBreakdown.length || 1))}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-lg font-bold text-gray-900">
                {analyticsData?.categoryBreakdown[0]?.category || 'None'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {analyticsData?.categoryBreakdown[0] && formatCurrency(analyticsData.categoryBreakdown[0].amount)}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Insights</p>
              <p className="text-2xl font-bold text-gray-900">
                {insightsData.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {insightsData.filter(i => i.type === 'tip').length} tips available
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header title="Spending Trends" />
          <Card.Content>
            <SpendingChart data={trendsData} period={selectedPeriod} />
          </Card.Content>
        </Card>

        <Card>
          <Card.Header title="Category Breakdown" />
          <Card.Content>
            <CategoryChart data={analyticsData?.categoryBreakdown || []} />
          </Card.Content>
        </Card>
      </div>

      {/* AI Insights */}
      {insightsData.length > 0 && (
        <Card>
          <Card.Header title="AI-Powered Insights" subtitle="Personalized recommendations based on your spending" />
          <Card.Content>
            <div className="space-y-4">
              {insightsData.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'warning'
                      ? 'bg-red-50 border-red-400'
                      : insight.type === 'tip'
                      ? 'bg-blue-50 border-blue-400'
                      : insight.type === 'achievement'
                      ? 'bg-green-50 border-green-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      {insight.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-white rounded text-xs text-gray-600">
                          {insight.category}
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        insight.impact === 'high'
                          ? 'bg-red-100 text-red-800'
                          : insight.impact === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {insight.impact} impact
                    </span>
                  </div>
                </div>
              ))}

              {insightsData.length > 3 && (
                <div className="text-center">
                  <Button variant="secondary" size="sm">
                    View all {insightsData.length} insights
                  </Button>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Budget Tracker */}
      <BudgetTracker period={selectedPeriod} />
    </div>
  )
}

export default Dashboard