import { Response, NextFunction } from 'express'
import { Budget } from '../models/Budget'
import { Expense } from '../models/Expense'
import { AuthenticatedRequest } from '../middleware/auth'
import { catchAsync, createError, sendResponse } from '../middleware/errorHandler'
import { CreateBudgetRequest, UpdateBudgetRequest, BudgetResponse } from '../types'

export const getBudgets = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { period } = req.query

  let budgets: Budget[]

  if (period) {
    budgets = await Budget.findByUserAndPeriod(userId, period as string)
  } else {
    budgets = await Budget.findActiveByUser(userId)
  }

  // Calculate current spending for each budget
  const budgetResponses: BudgetResponse[] = await Promise.all(
    budgets.map(async (budget) => {
      // Get expenses for this budget's category and period
      const expenses = await Expense.find({
        userId,
        category: budget.category,
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate,
        },
      })

      const spent = expenses.reduce((total, expense) => total + expense.amount, 0)

      // Update budget with current spending
      budget.updateSpent(spent)
      await budget.save()

      return {
        id: budget.id,
        userId: budget.userId,
        category: budget.category,
        amount: budget.amount,
        spent: budget.spent,
        remaining: budget.remaining,
        period: budget.period,
        startDate: budget.startDate.toISOString(),
        endDate: budget.endDate.toISOString(),
        isActive: budget.isActive,
        alertThreshold: budget.alertThreshold,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
      }
    })
  )

  sendResponse(res, 200, 'Budgets retrieved successfully', budgetResponses)
})

export const getBudget = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const budget = await Budget.findOne({ where: { id, userId } })

  if (!budget) {
    return next(createError('Budget not found', 404))
  }

  // Update spending
  const expenses = await Expense.find({
    userId,
    category: budget.category,
    date: {
      $gte: budget.startDate,
      $lte: budget.endDate,
    },
  })

  const spent = expenses.reduce((total, expense) => total + expense.amount, 0)
  budget.updateSpent(spent)
  await budget.save()

  const budgetResponse: BudgetResponse = {
    id: budget.id,
    userId: budget.userId,
    category: budget.category,
    amount: budget.amount,
    spent: budget.spent,
    remaining: budget.remaining,
    period: budget.period,
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate.toISOString(),
    isActive: budget.isActive,
    alertThreshold: budget.alertThreshold,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  }

  sendResponse(res, 200, 'Budget retrieved successfully', budgetResponse)
})

export const createBudget = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user!.id
  const { category, amount, period, alertThreshold = 80 }: CreateBudgetRequest = req.body

  // Check if budget already exists for this category and period
  const existingBudget = await Budget.findOne({
    where: {
      userId,
      category,
      period,
      isActive: true,
    },
  })

  if (existingBudget) {
    return next(createError(`Active budget already exists for ${category} (${period})`, 400))
  }

  const budget = await Budget.create({
    userId,
    category,
    amount,
    period,
    alertThreshold,
  })

  // Calculate initial spending
  const expenses = await Expense.find({
    userId,
    category: budget.category,
    date: {
      $gte: budget.startDate,
      $lte: budget.endDate,
    },
  })

  const spent = expenses.reduce((total, expense) => total + expense.amount, 0)
  budget.updateSpent(spent)
  await budget.save()

  const budgetResponse: BudgetResponse = {
    id: budget.id,
    userId: budget.userId,
    category: budget.category,
    amount: budget.amount,
    spent: budget.spent,
    remaining: budget.remaining,
    period: budget.period,
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate.toISOString(),
    isActive: budget.isActive,
    alertThreshold: budget.alertThreshold,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  }

  sendResponse(res, 201, 'Budget created successfully', budgetResponse)
})

export const updateBudget = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id
  const updateData: UpdateBudgetRequest = req.body

  const budget = await Budget.findOne({ where: { id, userId } })

  if (!budget) {
    return next(createError('Budget not found', 404))
  }

  // Update fields
  if (updateData.amount !== undefined) budget.amount = updateData.amount
  if (updateData.period !== undefined) budget.period = updateData.period
  if (updateData.alertThreshold !== undefined) budget.alertThreshold = updateData.alertThreshold
  if (updateData.isActive !== undefined) budget.isActive = updateData.isActive

  await budget.save()

  // Recalculate spending if period changed
  if (updateData.period) {
    const expenses = await Expense.find({
      userId,
      category: budget.category,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate,
      },
    })

    const spent = expenses.reduce((total, expense) => total + expense.amount, 0)
    budget.updateSpent(spent)
    await budget.save()
  }

  const budgetResponse: BudgetResponse = {
    id: budget.id,
    userId: budget.userId,
    category: budget.category,
    amount: budget.amount,
    spent: budget.spent,
    remaining: budget.remaining,
    period: budget.period,
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate.toISOString(),
    isActive: budget.isActive,
    alertThreshold: budget.alertThreshold,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  }

  sendResponse(res, 200, 'Budget updated successfully', budgetResponse)
})

export const deleteBudget = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const budget = await Budget.findOne({ where: { id, userId } })

  if (!budget) {
    return next(createError('Budget not found', 404))
  }

  await budget.destroy()

  sendResponse(res, 200, 'Budget deleted successfully')
})

export const getBudgetPerformance = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id
  const { period = 'monthly' } = req.query

  const budgets = await Budget.findByUserAndPeriod(userId, period as string)

  const performance = await Promise.all(
    budgets.map(async (budget) => {
      // Get daily spending for trend analysis
      const dailySpending = await Expense.aggregate([
        {
          $match: {
            userId,
            category: budget.category,
            date: {
              $gte: budget.startDate,
              $lte: budget.endDate,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ])

      const totalSpent = dailySpending.reduce((sum, day) => sum + day.amount, 0)
      budget.updateSpent(totalSpent)

      return {
        budgetId: budget.id,
        category: budget.category,
        budget: budget.amount,
        spent: budget.spent,
        remaining: budget.remaining,
        usagePercentage: budget.getUsagePercentage(),
        isOverBudget: budget.isOverBudget(),
        shouldAlert: budget.shouldAlert(),
        remainingDays: budget.getRemainingDays(),
        dailyBudgetRemaining: budget.getDailyBudgetRemaining(),
        dailySpending,
        status: budget.isOverBudget()
          ? 'over'
          : budget.shouldAlert()
          ? 'warning'
          : budget.getUsagePercentage() > 50
          ? 'good'
          : 'excellent',
      }
    })
  )

  sendResponse(res, 200, 'Budget performance retrieved successfully', performance)
})

export const getBudgetAlerts = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  const budgets = await Budget.findActiveByUser(userId)
  const alerts = []

  for (const budget of budgets) {
    // Update spending
    const expenses = await Expense.find({
      userId,
      category: budget.category,
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate,
      },
    })

    const spent = expenses.reduce((total, expense) => total + expense.amount, 0)
    budget.updateSpent(spent)

    if (budget.shouldAlert()) {
      alerts.push({
        budgetId: budget.id,
        category: budget.category,
        type: budget.isOverBudget() ? 'over_budget' : 'approaching_limit',
        message: budget.isOverBudget()
          ? `You've exceeded your ${budget.category} budget by $${Math.abs(budget.remaining).toFixed(2)}`
          : `You've used ${budget.getUsagePercentage().toFixed(1)}% of your ${budget.category} budget`,
        severity: budget.isOverBudget() ? 'high' : 'medium',
        usagePercentage: budget.getUsagePercentage(),
        remainingAmount: budget.remaining,
        createdAt: new Date().toISOString(),
      })
    }
  }

  sendResponse(res, 200, 'Budget alerts retrieved successfully', alerts)
})

export const refreshBudgetSpending = catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  const budgets = await Budget.findActiveByUser(userId)

  const updatedBudgets = await Promise.all(
    budgets.map(async (budget) => {
      const expenses = await Expense.find({
        userId,
        category: budget.category,
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate,
        },
      })

      const spent = expenses.reduce((total, expense) => total + expense.amount, 0)
      budget.updateSpent(spent)
      await budget.save()

      return budget
    })
  )

  sendResponse(res, 200, 'Budget spending refreshed successfully', {
    updatedCount: updatedBudgets.length,
  })
})