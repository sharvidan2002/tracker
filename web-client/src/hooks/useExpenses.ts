import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Expense, ExpenseFormData, ExpenseFilters, SortOption, PaginatedResponse } from '../types'
import { expenseService } from '../services/expenses'
import { QUERY_KEYS } from '../utils/constants'

interface UseExpensesParams {
  page?: number
  limit?: number
  filters?: ExpenseFilters
  sort?: SortOption
}

export const useExpenses = (params: UseExpensesParams = {}) => {
  return useQuery<PaginatedResponse<Expense>, Error>(
    [QUERY_KEYS.EXPENSES, params],
    () => expenseService.getExpenses(params),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  )
}

export const useExpense = (id: string) => {
  return useQuery<Expense, Error>(
    [QUERY_KEYS.EXPENSE, id],
    () => expenseService.getExpense(id),
    {
      enabled: !!id,
    }
  )
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation<Expense, Error, ExpenseFormData>(
    expenseService.createExpense,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
        queryClient.invalidateQueries(QUERY_KEYS.ANALYTICS)
      },
    }
  )
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation<Expense, Error, { id: string; data: Partial<ExpenseFormData> }>(
    ({ id, data }) => expenseService.updateExpense(id, data),
    {
      onSuccess: (updatedExpense) => {
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
        queryClient.invalidateQueries([QUERY_KEYS.EXPENSE, updatedExpense.id])
        queryClient.invalidateQueries(QUERY_KEYS.ANALYTICS)
      },
    }
  )
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>(
    expenseService.deleteExpense,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
        queryClient.invalidateQueries(QUERY_KEYS.ANALYTICS)
      },
    }
  )
}

export const useCategorizeExpense = () => {
  return useMutation<
    { category: string; confidence: number },
    Error,
    { description: string; merchant?: string }
  >(
    ({ description, merchant }) => expenseService.categorizeExpense(description, merchant)
  )
}

export const useBulkCategorize = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Array<{ id: string; category: string; confidence: number }>,
    Error,
    Array<{ id: string; description: string; merchant?: string }>
  >(
    expenseService.bulkCategorize,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
      },
    }
  )
}

export const useUploadReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation<
    { receiptUrl: string },
    Error,
    { expenseId: string; file: File; onProgress?: (progress: number) => void }
  >(
    ({ expenseId, file, onProgress }) => expenseService.uploadReceipt(expenseId, file, onProgress),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries([QUERY_KEYS.EXPENSE, variables.expenseId])
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
      },
    }
  )
}

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>(
    expenseService.deleteReceipt,
    {
      onSuccess: (_, expenseId) => {
        queryClient.invalidateQueries([QUERY_KEYS.EXPENSE, expenseId])
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
      },
    }
  )
}

export const useSearchExpenses = (query: string) => {
  return useQuery<Expense[], Error>(
    [QUERY_KEYS.EXPENSES, 'search', query],
    () => expenseService.searchExpenses(query),
    {
      enabled: query.length > 2,
      staleTime: 30000,
    }
  )
}

export const useDuplicateExpenses = () => {
  return useQuery<Array<{ original: Expense; duplicates: Expense[] }>, Error>(
    [QUERY_KEYS.EXPENSES, 'duplicates'],
    expenseService.getDuplicateExpenses,
    {
      staleTime: 60000, // 1 minute
    }
  )
}

export const useMergeDuplicates = () => {
  const queryClient = useQueryClient()

  return useMutation<Expense, Error, { originalId: string; duplicateIds: string[] }>(
    ({ originalId, duplicateIds }) => expenseService.mergeDuplicateExpenses(originalId, duplicateIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(QUERY_KEYS.EXPENSES)
        queryClient.invalidateQueries(QUERY_KEYS.ANALYTICS)
      },
    }
  )
}