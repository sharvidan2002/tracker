import React, { useState } from 'react'
import { Search, Filter, Calendar, DollarSign, MoreVertical, Grid, List } from 'lucide-react'
import { ExpenseFilters, SortOption, Expense } from '../../types'
import { useExpenses } from '../../hooks/useExpenses'
import ExpenseCard from './ExpenseCard'
import ExpenseForm from './ExpenseForm'
import Button from '../ui/Button'
import Input from '../ui/Input'
import LoadingSpinner from '../ui/LoadingSpinner'
import Modal from '../ui/Modal'
import { EXPENSE_CATEGORIES, PAGINATION } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'

interface ExpenseListProps {
  showHeader?: boolean
  compact?: boolean
  limit?: number
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  showHeader = true,
  compact = false,
  limit,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [sort, setSort] = useState<SortOption>({ field: 'date', direction: 'desc' })
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const {
    data: expensesData,
    isLoading,
    isError,
    error,
  } = useExpenses({
    page: currentPage,
    limit: limit || PAGINATION.DEFAULT_LIMIT,
    filters: {
      ...filters,
      ...(searchQuery && { search: searchQuery }),
    },
    sort,
  })

  const expenses = expensesData?.data || []
  const pagination = expensesData?.pagination

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort)
    setCurrentPage(1)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load expenses</p>
        <p className="text-sm text-gray-500 mt-1">
          {error?.message || 'Please try again later'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
            {pagination && (
              <p className="text-sm text-gray-600 mt-1">
                {pagination.total} expenses • Total: {formatCurrency(totalAmount)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              Add Expense
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search expenses..."
            leftIcon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(true)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>

          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [string, 'asc' | 'desc']
              handleSortChange({ field: field as any, direction })
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
            <option value="category-asc">Category A-Z</option>
            <option value="merchant-asc">Merchant A-Z</option>
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {(Object.keys(filters).length > 0 || searchQuery) && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-black text-white text-xs">
              Search: {searchQuery}
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-black text-white text-xs">
              Category: {filters.category}
            </span>
          )}
          {filters.merchant && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-black text-white text-xs">
              Merchant: {filters.merchant}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first expense'}
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            Add Expense
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              compact={viewMode === 'list' || compact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setCurrentPage(pagination.page - 1)}
            >
              Previous
            </Button>

            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              )
            })}

            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setCurrentPage(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <ExpenseForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Filters Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
      />
    </div>
  )
}

// Filter Modal Component
interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: ExpenseFilters
  onFiltersChange: (filters: Partial<ExpenseFilters>) => void
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}) => {
  const [tempFilters, setTempFilters] = useState<ExpenseFilters>(filters)

  const handleApply = () => {
    onFiltersChange(tempFilters)
    onClose()
  }

  const handleReset = () => {
    setTempFilters({})
    onFiltersChange({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Expenses">
      <Modal.Content>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={tempFilters.category || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date from"
              type="date"
              value={tempFilters.dateFrom || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />
            <Input
              label="Date to"
              type="date"
              value={tempFilters.dateTo || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={tempFilters.minAmount || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || undefined }))}
            />
            <Input
              label="Max amount"
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={tempFilters.maxAmount || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || undefined }))}
            />
          </div>

          <Input
            label="Merchant"
            type="text"
            placeholder="Filter by merchant"
            value={tempFilters.merchant || ''}
            onChange={(e) => setTempFilters(prev => ({ ...prev, merchant: e.target.value || undefined }))}
          />
        </div>
      </Modal.Content>

      <Modal.Footer>
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default ExpenseList