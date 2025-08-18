import React, { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, Receipt, Tag } from 'lucide-react'
import { Expense } from '../../types'
import { useDeleteExpense } from '../../hooks/useExpenses'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import ExpenseForm from './ExpenseForm'
import { formatCurrency, formatDate, formatRelativeDate, formatCategoryName } from '../../utils/formatters'
import { EXPENSE_CATEGORIES } from '../../utils/constants'

interface ExpenseCardProps {
  expense: Expense
  onEdit?: (expense: Expense) => void
  showActions?: boolean
  compact?: boolean
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onEdit,
  showActions = true,
  compact = false,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const deleteExpense = useDeleteExpense()

  const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.name === expense.category)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(expense)
    } else {
      setShowEditModal(true)
    }
    setShowMenu(false)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
    setShowMenu(false)
  }

  const confirmDelete = async () => {
    try {
      await deleteExpense.mutateAsync(expense.id)
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-sm">{categoryInfo?.icon || '📝'}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{expense.description}</p>
            <p className="text-xs text-gray-500">
              {expense.merchant && `${expense.merchant} • `}
              {formatRelativeDate(expense.date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(expense.amount)}
          </p>
          {expense.category && (
            <p className="text-xs text-gray-500">
              {formatCategoryName(expense.category)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Card hover className="transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: categoryInfo?.color || '#737373' }}
            >
              <span className="text-white text-sm">
                {categoryInfo?.icon || '📝'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {expense.description}
              </h3>

              {expense.merchant && (
                <p className="text-sm text-gray-600 truncate">
                  {expense.merchant}
                </p>
              )}

              <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatDate(expense.date)}</span>
                <span>•</span>
                <span>{formatRelativeDate(expense.date)}</span>
              </div>

              {expense.category && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                    {formatCategoryName(expense.category)}
                  </span>
                </div>
              )}

              {expense.tags && expense.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {expense.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-xs text-gray-600"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {expense.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{expense.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            {showActions && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-medium border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </button>

                      {expense.receipt && (
                        <button
                          onClick={() => window.open(expense.receipt, '_blank')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View Receipt
                        </button>
                      )}

                      <button
                        onClick={handleDelete}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <ExpenseForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        expense={expense}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Expense"
        size="sm"
      >
        <Modal.Content>
          <p className="text-gray-600">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{expense.description}</p>
            <p className="text-sm text-gray-600">
              {formatCurrency(expense.amount)} • {formatDate(expense.date)}
            </p>
          </div>
        </Modal.Content>

        <Modal.Footer>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              loading={deleteExpense.isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Delete
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  )
}

export default ExpenseCard