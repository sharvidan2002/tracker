import { Response, NextFunction } from 'express'
import { Expense } from '../models/Expense'
import { AuthenticatedRequest } from '../middleware/auth'
import { catchAsync, createError, sendResponse, sendPaginatedResponse } from '../middleware/errorHandler'
import { mlService } from '../services/mlService'
import {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseResponse,
  ExpenseQuery,
  CategorizeRequest,
  BulkCategorizeRequest
} from '../types'

export const getExpenses = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const {
    page = 1,
    limit = 20,
    category,
    merchant,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    tags,
    sortBy = 'date',
    sortOrder = 'desc',
    search
  }: ExpenseQuery = req.query as any

  const options: any = {
    page: Number(page),
    limit: Number(limit),
    sortBy,
    sortOrder,
  }

  // Add filters
  if (category) options.category = category
  if (merchant) options.merchant = merchant
  if (dateFrom) options.dateFrom = dateFrom
  if (dateTo) options.dateTo = dateTo
  if (minAmount) options.minAmount = Number(minAmount)
  if (maxAmount) options.maxAmount = Number(maxAmount)
  if (tags) options.tags = Array.isArray(tags) ? tags : [tags]

  // Handle search
  let expenses
  let total

  if (search) {
    expenses = await Expense.searchByText(userId, search as string)
    total = expenses.length

    // Apply pagination to search results
    const startIndex = (options.page - 1) * options.limit
    expenses = expenses.slice(startIndex, startIndex + options.limit)
  } else {
    // Get expenses with filters
    expenses = await Expense.findByUser(userId, options)

    // Get total count for pagination
    const countOptions = { ...options }
    delete countOptions.page
    delete countOptions.limit
    const allExpenses = await Expense.findByUser(userId, countOptions)
    total = allExpenses.length
  }

  const pagination = {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
    hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
    hasPrevPage: Number(page) > 1,
  }

  const expenseResponses: ExpenseResponse[] = expenses.map(expense => ({
    id: expense.id,
    userId: expense.userId,
    amount: expense.amount,
    description: expense.description,
    category: expense.category,
    merchant: expense.merchant,
    date: expense.date.toISOString(),
    tags: expense.tags,
    receipt: expense.receipt,
    metadata: expense.metadata,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  }))

  sendPaginatedResponse(res, 200, 'Expenses retrieved successfully', expenseResponses, pagination)
})

export const getExpense = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const expense = await Expense.findOne({ _id: id, userId })

  if (!expense) {
    return next(createError('Expense not found', 404))
  }

  const expenseResponse: ExpenseResponse = {
    id: expense.id,
    userId: expense.userId,
    amount: expense.amount,
    description: expense.description,
    category: expense.category,
    merchant: expense.merchant,
    date: expense.date.toISOString(),
    tags: expense.tags,
    receipt: expense.receipt,
    metadata: expense.metadata,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  }

  sendResponse(res, 200, 'Expense retrieved successfully', expenseResponse)
})

export const createExpense = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { amount, description, category, merchant, date, tags }: CreateExpenseRequest = req.body

  // Auto-categorize if no category provided
  let finalCategory = category
  let confidence = 0

  if (!category && description) {
    try {
      const categorization = await mlService.categorizeExpense(description, merchant)
      finalCategory = categorization.category
      confidence = categorization.confidence
    } catch (error) {
      console.warn('Auto-categorization failed:', error)
    }
  }

  const expense = new Expense({
    userId,
    amount,
    description,
    category: finalCategory,
    merchant,
    date: new Date(date),
    tags: tags || [],
    metadata: {
      source: 'manual',
      confidence: confidence > 0 ? confidence : undefined,
    },
  })

  await expense.save()

  const expenseResponse: ExpenseResponse = {
    id: expense.id,
    userId: expense.userId,
    amount: expense.amount,
    description: expense.description,
    category: expense.category,
    merchant: expense.merchant,
    date: expense.date.toISOString(),
    tags: expense.tags,
    receipt: expense.receipt,
    metadata: expense.metadata,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  }

  sendResponse(res, 201, 'Expense created successfully', expenseResponse)
})

export const updateExpense = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id
  const updateData: UpdateExpenseRequest = req.body

  const expense = await Expense.findOne({ _id: id, userId })

  if (!expense) {
    return next(createError('Expense not found', 404))
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof UpdateExpenseRequest] !== undefined) {
      if (key === 'date') {
        expense[key] = new Date(updateData[key] as string)
      } else {
        expense[key] = updateData[key as keyof UpdateExpenseRequest]
      }
    }
  })

  await expense.save()

  const expenseResponse: ExpenseResponse = {
    id: expense.id,
    userId: expense.userId,
    amount: expense.amount,
    description: expense.description,
    category: expense.category,
    merchant: expense.merchant,
    date: expense.date.toISOString(),
    tags: expense.tags,
    receipt: expense.receipt,
    metadata: expense.metadata,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  }

  sendResponse(res, 200, 'Expense updated successfully', expenseResponse)
})

export const deleteExpense = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const expense = await Expense.findOne({ _id: id, userId })

  if (!expense) {
    return next(createError('Expense not found', 404))
  }

  await expense.deleteOne()

  sendResponse(res, 200, 'Expense deleted successfully')
})

export const categorizeExpense = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { description, merchant }: CategorizeRequest = req.body

  try {
    const result = await mlService.categorizeExpense(description, merchant)
    sendResponse(res, 200, 'Expense categorized successfully', result)
  } catch (error) {
    console.error('Categorization failed:', error)
    sendResponse(res, 200, 'Categorization failed, using default', {
      category: 'Other',
      confidence: 0,
    })
  }
})

export const bulkCategorize = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { expenses }: BulkCategorizeRequest = req.body
  const userId = req.user!.id

  const results = []

  for (const expenseData of expenses) {
    try {
      const categorization = await mlService.categorizeExpense(
        expenseData.description,
        expenseData.merchant
      )

      // Update the expense in the database
      await Expense.updateOne(
        { _id: expenseData.id, userId },
        {
          category: categorization.category,
          'metadata.confidence': categorization.confidence
        }
      )

      results.push({
        id: expenseData.id,
        category: categorization.category,
        confidence: categorization.confidence,
      })
    } catch (error) {
      results.push({
        id: expenseData.id,
        category: 'Other',
        confidence: 0,
      })
    }
  }

  sendResponse(res, 200, 'Bulk categorization completed', { results })
})

export const uploadReceipt = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id
  const file = req.file

  if (!file) {
    return next(createError('No file uploaded', 400))
  }

  const expense = await Expense.findOne({ _id: id, userId })

  if (!expense) {
    return next(createError('Expense not found', 404))
  }

  // In a real app, you'd upload to a file storage service (AWS S3, etc.)
  const receiptUrl = `/uploads/receipts/${file.filename}`

  expense.receipt = receiptUrl
  await expense.save()

  sendResponse(res, 200, 'Receipt uploaded successfully', { receiptUrl })
})

export const deleteReceipt = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const expense = await Expense.findOne({ _id: id, userId })

  if (!expense) {
    return next(createError('Expense not found', 404))
  }

  expense.receipt = undefined
  await expense.save()

  sendResponse(res, 200, 'Receipt deleted successfully')
})

export const getDuplicates = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  // Find potential duplicates based on amount, date, and description similarity
  const duplicates = await Expense.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          amount: '$amount',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          description: '$description'
        },
        expenses: { $push: '$$ROOT' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 50 }
  ])

  const duplicateGroups = duplicates.map(group => ({
    original: group.expenses[0],
    duplicates: group.expenses.slice(1)
  }))

  sendResponse(res, 200, 'Duplicate expenses found', duplicateGroups)
})

export const mergeDuplicates = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { originalId, duplicateIds } = req.body
  const userId = req.user!.id

  // Verify original expense exists and belongs to user
  const originalExpense = await Expense.findOne({ _id: originalId, userId })
  if (!originalExpense) {
    return next(createError('Original expense not found', 404))
  }

  // Delete duplicate expenses
  await Expense.deleteMany({
    _id: { $in: duplicateIds },
    userId
  })

  sendResponse(res, 200, 'Duplicate expenses merged successfully', {
    id: originalExpense.id,
    mergedCount: duplicateIds.length
  })
})

export const exportExpenses = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { format = 'csv' } = req.query

  const expenses = await Expense.findByUser(userId, { limit: 10000 })

  if (format === 'csv') {
    const csvHeaders = ['Date', 'Description', 'Category', 'Merchant', 'Amount', 'Tags']
    const csvRows = expenses.map(expense => [
      expense.date.toISOString().split('T')[0],
      expense.description,
      expense.category || '',
      expense.merchant || '',
      expense.amount.toString(),
      expense.tags?.join(', ') || ''
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="expenses.csv"`)
    res.send(csvContent)
  } else {
    sendResponse(res, 400, 'Unsupported export format')
  }
})