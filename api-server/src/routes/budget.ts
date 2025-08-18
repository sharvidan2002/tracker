import { Router } from 'express'
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetPerformance,
  getBudgetAlerts,
  refreshBudgetSpending,
} from '../controllers/budgetController'
import { authenticateToken } from '../middleware/auth'
import { validate, validateQuery, schemas, validateId } from '../middleware/validation'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Budget CRUD routes
router.get('/', validateQuery(schemas.budgetQuery), getBudgets)
router.post('/', validate(schemas.createBudget), createBudget)

// Budget management routes
router.get('/performance', validateQuery(schemas.budgetQuery), getBudgetPerformance)
router.get('/alerts', getBudgetAlerts)
router.post('/refresh', refreshBudgetSpending)

// Individual budget routes
router.get('/:id', validateId(), getBudget)
router.put('/:id', validateId(), validate(schemas.updateBudget), updateBudget)
router.delete('/:id', validateId(), deleteBudget)

export default router