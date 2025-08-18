import React, { useState } from 'react'
import { Plus, TrendingUp, DollarSign, Calendar, Eye } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDashboardData } from '../hooks/useAnalytics'
import { useExpenses } from '../hooks/useExpenses'
import Dashboard from '../components/analytics/Dashboard'
import ExpenseCard from '../components/expense/ExpenseCard'
import ExpenseForm from '../components/expense/ExpenseForm'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatCurrency, formatRelativeDate } from '../utils/formatters'

const Home: React.FC = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showFullDashboard, setShowFullDashboard] = useState(false)
  const { user } = useAuth()

  const { analytics, isLoading: analyticsLoading } = useDashboardData('month')
  const { data: recentExpenses, isLoading: expensesLoading } = useExpenses({
    limit: 5,
    sort: { field: 'date', direction: 'desc' }
  })

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const quickStats = [
    {
      title: 'This Month',
      value: formatCurrency(analytics.data?.totalSpent || 0),
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'increase' as const,
    },
    {
      title: 'This Week',
      value: formatCurrency((analytics.data?.totalSpent || 0) * 0.25), // Rough estimate
      icon: Calendar,
      change: '-8.2%',
      changeType: 'decrease' as const,
    },
    {
      title: 'Categories',
      value: analytics.data?.categoryBreakdown.length || 0,
      icon: TrendingUp,
      change: '+2',
      changeType: 'increase' as const,
    },
  ]

  if (showFullDashboard) {
    return <Dashboard />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your spending overview for {formatRelativeDate(new Date().toISOString())}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowExpenseForm(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Expense
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title} hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 flex items-center ${
                  stat.changeType === 'increase' ? 'text-red-600' : 'text-green-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    stat.changeType === 'decrease' ? 'rotate-180' : ''
                  }`} />
                  {stat.change} from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-black rounded-xl flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header title="Quick Actions" />
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="secondary"
              onClick={() => setShowExpenseForm(true)}
              className="h-20 flex-col space-y-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Expense</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowFullDashboard(true)}
              className="h-20 flex-col space-y-2"
            >
              <Eye className="h-5 w-5" />
              <span>View Analytics</span>
            </Button>

            <Button
              variant="secondary"
              className="h-20 flex-col space-y-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Set Budget</span>
            </Button>

            <Button
              variant="secondary"
              className="h-20 flex-col space-y-2"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Export Data</span>
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Recent Expenses & Mini Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card>
          <Card.Header
            title="Recent Expenses"
            action={
              <Button variant="ghost" size="sm">
                View All
              </Button>
            }
          />
          <Card.Content>
            {expensesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentExpenses?.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No expenses yet</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowExpenseForm(true)}
                >
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses?.data.slice(0, 5).map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    compact
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Mini Analytics */}
        <Card>
          <Card.Header
            title="Spending Overview"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDashboard(true)}
              >
                View Full Dashboard
              </Button>
            }
          />
          <Card.Content>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : analytics.data?.categoryBreakdown.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No spending data yet</p>
                <p className="text-sm text-gray-400">
                  Add some expenses to see your spending patterns
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top Categories */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Categories</h4>
                  <div className="space-y-2">
                    {analytics.data?.categoryBreakdown.slice(0, 3).map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category.category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-black h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-16 text-right">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* This Month Summary */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total this month</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(analytics.data?.totalSpent || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Average per day</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency((analytics.data?.totalSpent || 0) / new Date().getDate())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* AI Insights Preview */}
      {analytics.data && (
        <Card>
          <Card.Header title="AI Insights" subtitle="Smart recommendations for your spending" />
          <Card.Content>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Spending Pattern Detected</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You've spent 23% more on dining this month compared to last month.
                    Consider setting a dining budget to help track this category.
                  </p>
                  <div className="flex items-center space-x-3 mt-3">
                    <Button variant="primary" size="sm">
                      Set Dining Budget
                    </Button>
                    <Button variant="ghost" size="sm">
                      View More Insights
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Add Expense Modal */}
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
      />
    </div>
  )
}

export default Home