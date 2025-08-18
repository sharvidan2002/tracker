import { Schema, model, Document } from 'mongoose'

export interface IExpense extends Document {
  _id: string
  userId: string
  amount: number
  description: string
  category?: string
  merchant?: string
  date: Date
  tags?: string[]
  receipt?: string
  metadata?: {
    source?: 'manual' | 'imported' | 'api'
    confidence?: number
    originalDescription?: string
    location?: {
      latitude: number
      longitude: number
      address?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0'],
      validate: {
        validator: function(value: number) {
          return Number.isFinite(value) && value > 0
        },
        message: 'Amount must be a positive number'
      }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [255, 'Description cannot exceed 255 characters'],
      minlength: [1, 'Description is required'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
      index: true,
    },
    merchant: {
      type: String,
      trim: true,
      maxlength: [100, 'Merchant cannot exceed 100 characters'],
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters'],
    }],
    receipt: {
      type: String, // URL to receipt image/PDF
      validate: {
        validator: function(value: string) {
          if (!value) return true
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
        message: 'Receipt must be a valid URL'
      }
    },
    metadata: {
      source: {
        type: String,
        enum: ['manual', 'imported', 'api'],
        default: 'manual',
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      originalDescription: {
        type: String,
        maxlength: 255,
      },
      location: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
        address: {
          type: String,
          maxlength: 200,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      }
    }
  }
)

// Indexes for better query performance
ExpenseSchema.index({ userId: 1, date: -1 })
ExpenseSchema.index({ userId: 1, category: 1 })
ExpenseSchema.index({ userId: 1, merchant: 1 })
ExpenseSchema.index({ userId: 1, amount: 1 })
ExpenseSchema.index({ userId: 1, tags: 1 })
ExpenseSchema.index({ description: 'text', merchant: 'text' })

// Virtual for formatted amount
ExpenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount)
})

// Instance methods
ExpenseSchema.methods.addTag = function(tag: string) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag)
  }
  return this.save()
}

ExpenseSchema.methods.removeTag = function(tag: string) {
  this.tags = this.tags.filter((t: string) => t !== tag)
  return this.save()
}

ExpenseSchema.methods.updateCategory = function(category: string, confidence?: number) {
  this.category = category
  if (confidence !== undefined) {
    this.metadata = this.metadata || {}
    this.metadata.confidence = confidence
  }
  return this.save()
}

// Static methods
ExpenseSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const query = { userId }

  // Add filters
  if (options.category) query.category = options.category
  if (options.merchant) query.merchant = new RegExp(options.merchant, 'i')
  if (options.tags) query.tags = { $in: options.tags }
  if (options.dateFrom || options.dateTo) {
    query.date = {}
    if (options.dateFrom) query.date.$gte = new Date(options.dateFrom)
    if (options.dateTo) query.date.$lte = new Date(options.dateTo)
  }
  if (options.minAmount || options.maxAmount) {
    query.amount = {}
    if (options.minAmount) query.amount.$gte = options.minAmount
    if (options.maxAmount) query.amount.$lte = options.maxAmount
  }

  let mongoQuery = this.find(query)

  // Add sorting
  if (options.sortBy) {
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1
    mongoQuery = mongoQuery.sort({ [options.sortBy]: sortOrder })
  } else {
    mongoQuery = mongoQuery.sort({ date: -1 })
  }

  // Add pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit
    mongoQuery = mongoQuery.skip(skip).limit(options.limit)
  }

  return mongoQuery
}

ExpenseSchema.statics.searchByText = function(userId: string, searchText: string) {
  return this.find({
    userId,
    $text: { $search: searchText }
  }).sort({ score: { $meta: 'textScore' } })
}

ExpenseSchema.statics.getAnalytics = function(userId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ])
}

ExpenseSchema.statics.getMerchantAnalytics = function(userId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        userId,
        merchant: { $exists: true, $ne: null },
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$merchant',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    },
    {
      $limit: 10
    }
  ])
}

ExpenseSchema.statics.getSpendingTrends = function(userId: string, startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
  let dateFormat: string
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d'
      break
    case 'week':
      dateFormat = '%Y-%U'
      break
    case 'month':
      dateFormat = '%Y-%m'
      break
  }

  return this.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$date' } },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ])
}

// Pre-save middleware
ExpenseSchema.pre('save', function(next) {
  // Ensure tags are unique and clean
  if (this.tags) {
    this.tags = [...new Set(this.tags.map(tag => tag.trim()).filter(tag => tag))]
  }

  // Clean merchant name
  if (this.merchant) {
    this.merchant = this.merchant.trim()
  }

  next()
})

export const Expense = model<IExpense>('Expense', ExpenseSchema)