import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
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
  importExpenses,
  getExpenseAnalytics,
  getExpenseStats,
  bulkDeleteExpenses,
  bulkUpdateExpenses,
} from '../controllers/expenseController'
import { authenticateToken } from '../middleware/auth'
import { validate, validateQuery, schemas, validateId, validatePagination } from '../middleware/validation'
import { rateLimiter } from '../middleware/rateLimiter'
import { config } from '../config/environment'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(config.UPLOAD_DIR, 'receipts', req.user.id)

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `receipt-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'), false)
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
    files: 5, // Maximum 5 files per request
  },
  fileFilter
})

// Import file upload configuration
const importStorage = multer.memoryStorage()
const importUpload = multer({
  storage: importStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for import files
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json'
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type for import. Only CSV, Excel, and JSON files are allowed.'), false)
    }
  }
})

// Rate limiting for expensive operations
const expensiveOperationsLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for expensive operations
  message: 'Too many expensive operations from this IP, please try again later.'
})

const mlOperationsLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit ML operations
  message: 'Too many ML requests from this IP, please try again later.'
})

// Expense CRUD routes
router.get('/', validateQuery(schemas.expenseQuery), validatePagination, getExpenses)
router.get('/search', validateQuery(schemas.expenseQuery), getExpenses)
router.get('/stats', validateQuery(schemas.analyticsQuery), getExpenseStats)
router.get('/analytics', validateQuery(schemas.analyticsQuery), getExpenseAnalytics)
router.get('/export', expensiveOperationsLimiter, validateQuery(schemas.exportQuery), exportExpenses)
router.get('/duplicates', getDuplicates)

router.post('/', validate(schemas.createExpense), createExpense)
router.post('/import', expensiveOperationsLimiter, importUpload.single('file'), validate(schemas.importExpense), importExpenses)
router.post('/merge', validate(schemas.mergeDuplicates), mergeDuplicates)
router.post('/bulk-delete', validate(schemas.bulkDelete), bulkDeleteExpenses)
router.post('/bulk-update', validate(schemas.bulkUpdate), bulkUpdateExpenses)

// Individual expense routes
router.get('/:id', validateId(), getExpense)
router.put('/:id', validateId(), validate(schemas.updateExpense), updateExpense)
router.delete('/:id', validateId(), deleteExpense)

// Receipt management routes
router.post('/:id/receipt', validateId(), upload.array('receipts', 5), uploadReceipt)
router.delete('/:id/receipt/:receiptId', validateId('id'), validateId('receiptId'), deleteReceipt)
router.get('/:id/receipts', validateId(), (req, res, next) => {
  // Get all receipts for an expense
  // Implementation would go in controller
  next()
})

// ML/AI routes
router.post('/categorize', mlOperationsLimiter, validate(schemas.categorizeExpense), categorizeExpense)
router.post('/categorize/bulk', mlOperationsLimiter, validate(schemas.bulkCategorize), bulkCategorize)
router.post('/categorize/feedback', validate(schemas.categorizeFeedback), (req, res, next) => {
  // Handle ML feedback for improving model
  // Implementation would go in controller
  next()
})

// Advanced search and filtering
router.post('/search/advanced', validateQuery(schemas.advancedSearch), (req, res, next) => {
  // Advanced search with complex filters
  // Implementation would go in controller
  next()
})

// Expense templates (for recurring expenses)
router.get('/templates', (req, res, next) => {
  // Get user's expense templates
  next()
})

router.post('/templates', validate(schemas.createTemplate), (req, res, next) => {
  // Create expense template
  next()
})

router.post('/templates/:id/apply', validateId(), (req, res, next) => {
  // Apply template to create new expense
  next()
})

// Recurring expenses
router.get('/recurring', (req, res, next) => {
  // Get recurring expenses
  next()
})

router.post('/recurring', validate(schemas.createRecurring), (req, res, next) => {
  // Create recurring expense
  next()
})

router.put('/recurring/:id', validateId(), validate(schemas.updateRecurring), (req, res, next) => {
  // Update recurring expense
  next()
})

router.delete('/recurring/:id', validateId(), (req, res, next) => {
  // Delete recurring expense
  next()
})

// Expense sharing (for family accounts)
router.post('/:id/share', validateId(), validate(schemas.shareExpense), (req, res, next) => {
  // Share expense with other users
  next()
})

router.delete('/:id/share/:userId', validateId('id'), validateId('userId'), (req, res, next) => {
  // Remove sharing for specific user
  next()
})

// Expense comments/notes
router.get('/:id/comments', validateId(), (req, res, next) => {
  // Get comments for expense
  next()
})

router.post('/:id/comments', validateId(), validate(schemas.createComment), (req, res, next) => {
  // Add comment to expense
  next()
})

router.put('/comments/:commentId', validateId('commentId'), validate(schemas.updateComment), (req, res, next) => {
  // Update comment
  next()
})

router.delete('/comments/:commentId', validateId('commentId'), (req, res, next) => {
  // Delete comment
  next()
})

// Expense flagging/reporting
router.post('/:id/flag', validateId(), validate(schemas.flagExpense), (req, res, next) => {
  // Flag expense for review
  next()
})

router.post('/:id/unflag', validateId(), (req, res, next) => {
  // Remove flag from expense
  next()
})

// Expense verification (for business accounts)
router.post('/:id/verify', validateId(), (req, res, next) => {
  // Mark expense as verified
  next()
})

router.post('/:id/reject', validateId(), validate(schemas.rejectExpense), (req, res, next) => {
  // Reject expense with reason
  next()
})

// Expense location tracking
router.post('/:id/location', validateId(), validate(schemas.addLocation), (req, res, next) => {
  // Add location data to expense
  next()
})

// Expense photo/receipt OCR processing
router.post('/ocr/process', upload.single('image'), (req, res, next) => {
  // Process receipt image with OCR
  next()
})

// Expense predictions and suggestions
router.get('/suggestions/merchants', (req, res, next) => {
  // Get merchant suggestions based on user history
  next()
})

router.get('/suggestions/categories', (req, res, next) => {
  // Get category suggestions
  next()
})

router.get('/predictions/monthly', (req, res, next) => {
  // Get monthly spending predictions
  next()
})

// Error handling middleware for file uploads
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      })
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next(error)
})

export default router