import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { useQuery } from 'react-query'
import { Budget } from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { QUERY_KEYS } from '../../utils/constants'
import apiClient from '../../services/api'

interface BudgetTrackerProps {
  period: 'week' | 'month' | 'year'
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ period }) => {
  const { data: budgets, isLoading, isError } = useQuery<Budget[]>(
    [QUERY_KEYS.BUDGET, period],
    () => apiClient.get<Budget[]>(`/api/budget?period=${period}`),
    {
      staleTime: 60000, // 1 minute
    }
  )

  if (isLoading) {
    return (
      <Card>
        <Card.Header title="Budget Tracker" />
        <Card.Content>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </Card.Content>
      </Card>
    )
  }

  if (isError || !budgets) {
    return (
      <Card>
        <Card.Header title="Budget Tracker" />
        <Card.Content>
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load budget data</p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <Card.Header
          title="Budget Tracker"
          subtitle="Set budgets to track your spending goals"
          action={
            <Button variant="primary" size="sm">
              Create Budget
            </Button>
          }
        />
        <Card.Content>
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set</h3>
            <p className="text-gray-600 mb-4">
              Create budgets to track your spending and reach your financial goals
            </p>
            <Button variant="primary">
              Set Your First Budget
            </Button>
          </div>
        </Card.Content>
      </Card>
    )
  }

  const getBudgetStatus = (budget: Budget) => {
    const spentPercentage = (budget.spent / budget.amount) * 100

    if (spentPercentage >= 100) return 'over'
    if (spentPercentage >= 80) return 'warning'
    if (spentPercentage >= 50) return 'good'
    return 'excellent'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'excellent': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="h-4 w-4" />
      case 'warning': return <TrendingUp className="h-4 w-4" />
      case 'good': return <TrendingDown className="h-4 w-4" />
      case 'excellent': return <CheckCircle className="h-4 w-4" />
      default: return null
    }
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0)

  return (
    <Card>
      <Card.Header
        title="Budget Tracker"
        subtitle={`Your ${period}ly budget progress`}
        action={
          <Button variant="secondary" size="sm">
            Manage Budgets
          </Button>
        }
      />
      <Card.Content>
        {/* Overall Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>

        {/* Individual Budget Progress */}
        <div className="space-y-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget)
            const spentPercentage = Math.min((budget.spent / budget.amount) * 100, 100)

            return (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{budget.category}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(spentPercentage)} used
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      spentPercentage >= 100
                        ? 'bg-red-500'
                        : spentPercentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>

                {/* Remaining Amount */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {budget.remaining >= 0 ? 'Remaining' : 'Over budget by'}
                  </span>
                  <span className={`text-xs font-medium ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Budget Performance Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">On Track</p>
              <p className="text-lg font-bold text-green-600">
                {budgets.filter(b => getBudgetStatus(b) === 'excellent' || getBudgetStatus(b) === 'good').length}
              </p>
              <p className="text-xs text-gray-500">budgets</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Over Budget</p>
              <p className="text-lg font-bold text-red-600">
                {budgets.filter(b => getBudgetStatus(b) === 'over').length}
              </p>
              <p className="text-xs text-gray-500">budgets</p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

export default BudgetTracker