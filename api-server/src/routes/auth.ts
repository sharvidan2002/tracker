import { Router } from 'express'
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  logout,
  getAllUsers,
} from '../controllers/authController'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { validate, schemas } from '../middleware/validation'

const router = Router()

// Public routes
router.post('/register', validate(schemas.register), register)
router.post('/login', validate(schemas.login), login)
router.post('/refresh', refreshToken)

// Protected routes
router.use(authenticateToken)

router.get('/profile', getProfile)
router.patch('/profile', updateProfile)
router.post('/change-password', changePassword)
router.post('/logout', logout)
router.delete('/deactivate', deactivateAccount)

// Admin routes
router.get('/users', requireAdmin, getAllUsers)

export default router