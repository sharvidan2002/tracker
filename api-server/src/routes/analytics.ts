import { Router } from 'express'
import {
  getDashboardAnalytics,
  getCategoryAnalytics,
  getSpendingTrends,
  getInsights,
  getComparativeAnalytics,
  getMonthlyReport,
} from '../controllers/analyticsController'
import { authenticateToken } from '../middleware/auth'
import { validateQuery, schemas } from '../middleware/validation'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Analytics routes
router.get('/dashboard', validateQuery(schemas.analyticsQuery), getDashboardAnalytics)
router.get('/trends', validateQuery(schemas.analyticsQuery), getSpendingTrends)
router.get('/insights', getInsights)
router.get('/comparative', validateQuery(schemas.analyticsQuery), getComparativeAnalytics)
router.get('/report/monthly', getMonthlyReport)

// Category-specific analytics
router.get('/category/:category', validateQuery(schemas.analyticsQuery), getCategoryAnalytics)

export default router