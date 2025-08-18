import React, { useState } from 'react'
import { Plus, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Budget, ExpenseCategory } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import BudgetTracker from '../components/analytics/BudgetTracker'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { EXPENSE_CATEGORIES, BUDGET_PERIODS, QUERY_KEYS } from '../utils/constants'
import apiClient from '../services/api'

const Budget: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')

  const queryClient = useQueryClient()

  const { data: budgets, isLoading, isError } = useQuery<Budget[]>(
    [QUERY_KEYS.BUDGET, selectedPeriod],
    () => apiClient.get<Budget[]>(`/api/budget?period=${selectedPeriod}`),
    {
      staleTime: 60000,
    }
  )

  const createBudget = useMutation(
    (data: { category: string; amount: number; period: string }) =>
      apiClient.post<Budget>('/api/budget', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.BUDGET])
        setShowCreateModal(false)
      },
    }
  )

  const updateBudget = useMutation(
    ({ id, data }: { id: string; data: Partial<Budget> }) =>
      apiClient.put<Budget>(`/api/budget/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.BUDGET])
      },
    }
  )

  const deleteBudget = useMutation(
    (id: string) => apiClient.delete(`/api/budget/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.BUDGET])
      },
    }
  )

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
        <p className="text-red-600">Failed to load budget data</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  const totalBudget = budgets?.reduce((sum, budget) => sum + budget.amount, 0) || 0
  const totalSpent = budgets?.reduce((sum, budget) => sum + budget.spent, 0) || 0
  const totalRemaining = totalBudget - totalSpent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Set and track your spending limits</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
          >
            {BUDGET_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Budget
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} limit
              </p>
            </div>
            <div className="h-10 w-10 bg-black rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {totalBudget > 0 && formatPercentage((totalSpent / totalBudget) * 100)} of budget
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(totalRemaining))}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              totalRemaining >= 0 ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {totalRemaining >= 0 ? (
                <TrendingUp className="h-5 w-5 text-white rotate-180" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Tracker */}
      <BudgetTracker period={selectedPeriod === 'weekly' ? 'week' : selectedPeriod === 'monthly' ? 'month' : 'year'} />

      {/* Budget List */}
      {budgets && budgets.length > 0 && (
        <Card>
          <Card.Header title="All Budgets" subtitle={`Your ${selectedPeriod} budget breakdown`} />
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Category</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Budget</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Spent</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Remaining</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Progress</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const spentPercentage = (budget.spent / budget.amount) * 100
                    return (
                      <tr key={budget.id} className="border-b border-gray-100">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm">
                              {EXPENSE_CATEGORIES.find(cat => cat.name === budget.category)?.icon || '📝'}
                            </span>
                            <span className="font-medium text-gray-900">{budget.category}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right text-sm text-gray-900">
                          {formatCurrency(budget.amount)}
                        </td>
                        <td className="py-4 text-right text-sm text-gray-900">
                          {formatCurrency(budget.spent)}
                        </td>
                        <td className={`py-4 text-right text-sm font-medium ${
                          budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(budget.remaining))}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  spentPercentage >= 100
                                    ? 'bg-red-500'
                                    : spentPercentage >= 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10">
                              {Math.round(spentPercentage)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBudget.mutate(budget.id)}
                            loading={deleteBudget.isLoading}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createBudget.mutate(data)}
        isLoading={createBudget.isLoading}
        period={selectedPeriod}
      />
    </div>
  )
}

// Create Budget Modal Component
interface CreateBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { category: string; amount: number; period: string }) => void
  isLoading: boolean
  period: string
}

const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  period,
}) => {
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (category && amount) {
      onSubmit({
        category,
        amount: parseFloat(amount),
        period,
      })
      setCategory('')
      setAmount('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Budget">
      <Modal.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black"
              required
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={`${period.charAt(0).toUpperCase() + period.slice(1)} Budget Amount`}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Set realistic budgets based on your past spending patterns.
              You can always adjust them later.
            </p>
          </div>
        </form>
      </Modal.Content>

      <Modal.Footer>
        <div className="flex items-center justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Create Budget
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default Budget