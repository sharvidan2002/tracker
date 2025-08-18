import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  categorizeExpense,
  bulkCategorize,
  uploadReceipt,
  deleteReceipt,
  getDuplicates,
  mergeDuplicates,
  exportExpenses,
} from '../controllers/expenseController'
import { authenticateToken } from '../middleware/auth'
import { validate, validateQuery, schemas, validateId, validatePagination } from '../middleware/validation'
import { config } from '../config/environment'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.UPLOAD_DIR, 'receipts'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'))
    }
  }
})

// Expense CRUD routes
router.get('/', validateQuery(schemas.expenseQuery), validatePagination, getExpenses)
router.get('/search', validateQuery(schemas.expenseQuery), getExpenses)
router.get('/export', validateQuery(schemas.expenseQuery), exportExpenses)
router.get('/duplicates', getDuplicates)
router.post('/merge', mergeDuplicates)

router.post('/', validate(schemas.createExpense), createExpense)

router.get('/:id', validateId(), getExpense)
router.put('/:id', validateId(), validate(schemas.updateExpense), updateExpense)
router.delete('/:id', validateId(), deleteExpense)

// Receipt management
router.post('/:id/receipt', validateId(), upload.single('file'), uploadReceipt)
router.delete('/:id/receipt', validateId(), deleteReceipt)

// ML/AI routes
router.post('/categorize', validate(schemas.categorizeExpense), categorizeExpense)
router.post('/categorize/bulk', validate(schemas.bulkCategorize), bulkCategorize)

export default router