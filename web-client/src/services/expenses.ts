import { Expense, ExpenseFormData, ExpenseFilters, SortOption, PaginatedResponse, Analytics, AIInsight } from '../types'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from './api'

interface GetExpensesParams {
  page?: number
  limit?: number
  filters?: ExpenseFilters
  sort?: SortOption
}

class ExpenseService {
  async getExpenses(params: GetExpensesParams = {}): Promise<PaginatedResponse<Expense>> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }

    if (params.sort) {
      queryParams.append('sortBy', params.sort.field)
      queryParams.append('sortOrder', params.sort.direction)
    }

    const url = `${API_ENDPOINTS.EXPENSES.LIST}?${queryParams.toString()}`
    return await apiClient.get<PaginatedResponse<Expense>>(url)
  }

  async getExpense(id: string): Promise<Expense> {
    return await apiClient.get<Expense>(`${API_ENDPOINTS.EXPENSES.LIST}/${id}`)
  }

  async createExpense(data: ExpenseFormData): Promise<Expense> {
    return await apiClient.post<Expense>(API_ENDPOINTS.EXPENSES.CREATE, data)
  }

  async updateExpense(id: string, data: Partial<ExpenseFormData>): Promise<Expense> {
    return await apiClient.put<Expense>(`${API_ENDPOINTS.EXPENSES.UPDATE}/${id}`, data)
  }

  async deleteExpense(id: string): Promise<void> {
    return await apiClient.delete(`${API_ENDPOINTS.EXPENSES.DELETE}/${id}`)
  }

  async categorizeExpense(description: string, merchant?: string): Promise<{ category: string; confidence: number }> {
    return await apiClient.post<{ category: string; confidence: number }>(API_ENDPOINTS.EXPENSES.CATEGORIZE, {
      description,
      merchant,
    })
  }

  async bulkCategorize(expenses: Array<{ id: string; description: string; merchant?: string }>): Promise<Array<{ id: string; category: string; confidence: number }>> {
    return await apiClient.post<Array<{ id: string; category: string; confidence: number }>>(`${API_ENDPOINTS.EXPENSES.CATEGORIZE}/bulk`, {
      expenses,
    })
  }

  async uploadReceipt(expenseId: string, file: File, onProgress?: (progress: number) => void): Promise<{ receiptUrl: string }> {
    return await apiClient.upload<{ receiptUrl: string }>(`${API_ENDPOINTS.EXPENSES.LIST}/${expenseId}/receipt`, file, onProgress)
  }

  async deleteReceipt(expenseId: string): Promise<void> {
    return await apiClient.delete(`${API_ENDPOINTS.EXPENSES.LIST}/${expenseId}/receipt`)
  }

  async getExpenseAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<Analytics> {
    return await apiClient.get<Analytics>(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?period=${period}`)
  }

  async getSpendingTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<Array<{ date: string; amount: number }>> {
    return await apiClient.get<Array<{ date: string; amount: number }>>(`${API_ENDPOINTS.ANALYTICS.TRENDS}?period=${period}`)
  }

  async getAIInsights(): Promise<AIInsight[]> {
    return await apiClient.get<AIInsight[]>(API_ENDPOINTS.ANALYTICS.INSIGHTS)
  }

  async exportExpenses(format: 'csv' | 'xlsx', filters?: ExpenseFilters): Promise<void> {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }

    await apiClient.download(`${API_ENDPOINTS.EXPENSES.LIST}/export?${queryParams.toString()}`, `expenses.${format}`)
  }

  async searchExpenses(query: string): Promise<Expense[]> {
    return await apiClient.get<Expense[]>(`${API_ENDPOINTS.EXPENSES.LIST}/search?q=${encodeURIComponent(query)}`)
  }

  async getDuplicateExpenses(): Promise<Array<{ original: Expense; duplicates: Expense[] }>> {
    return await apiClient.get<Array<{ original: Expense; duplicates: Expense[] }>>(`${API_ENDPOINTS.EXPENSES.LIST}/duplicates`)
  }

  async mergeDuplicateExpenses(originalId: string, duplicateIds: string[]): Promise<Expense> {
    return await apiClient.post<Expense>(`${API_ENDPOINTS.EXPENSES.LIST}/merge`, {
      originalId,
      duplicateIds,
    })
  }
}

export const expenseService = new ExpenseService()
export default expenseService