import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign, FileText, Store, Calendar, Tag, Loader2, X } from 'lucide-react'
import { ExpenseFormData, Expense, EXPENSE_CATEGORIES } from '../../types'
import { useCreateExpense, useUpdateExpense, useCategorizeExpense } from '../../hooks/useExpenses'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import { formatDate } from '../../utils/formatters'

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(255, 'Description is too long'),
  category: z.string().optional(),
  merchant: z.string().optional(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  expense?: Expense
  defaultValues?: Partial<ExpenseFormData>
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  expense,
  defaultValues,
}) => {
  const [tagInput, setTagInput] = useState('')
  const [suggestedCategory, setSuggestedCategory] = useState<string>('')
  const [categoryConfidence, setCategoryConfidence] = useState<number>(0)
  const [isCategorizingExpense, setIsCategorizingExpense] = useState(false)

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const categorizeExpense = useCategorizeExpense()

  const isEditing = !!expense

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || defaultValues?.amount || 0,
      description: expense?.description || defaultValues?.description || '',
      category: expense?.category || defaultValues?.category || '',
      merchant: expense?.merchant || defaultValues?.merchant || '',
      date: expense?.date ?
        new Date(expense.date).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      tags: expense?.tags || defaultValues?.tags || [],
    },
  })

  const watchedDescription = watch('description')
  const watchedMerchant = watch('merchant')
  const watchedTags = watch('tags') || []

  // Auto-categorize when description or merchant changes
  useEffect(() => {
    if (watchedDescription && watchedDescription.length > 3 && !isEditing) {
      const timeoutId = setTimeout(async () => {
        try {
          setIsCategorizingExpense(true)
          const result = await categorizeExpense.mutateAsync({
            description: watchedDescription,
            merchant: watchedMerchant || undefined,
          })

          if (result.data) {
            setSuggestedCategory(result.data.category)
            setCategoryConfidence(result.data.confidence)
          }
        } catch (error) {
          console.error('Error categorizing expense:', error)
        } finally {
          setIsCategorizingExpense(false)
        }
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [watchedDescription, watchedMerchant, categorizeExpense, isEditing])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        amount: expense?.amount || defaultValues?.amount || 0,
        description: expense?.description || defaultValues?.description || '',
        category: expense?.category || defaultValues?.category || '',
        merchant: expense?.merchant || defaultValues?.merchant || '',
        date: expense?.date ?
          new Date(expense.date).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0],
        tags: expense?.tags || defaultValues?.tags || [],
      })
      setSuggestedCategory('')
      setCategoryConfidence(0)
      setTagInput('')
    }
  }, [isOpen, expense, defaultValues, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const formattedData: ExpenseFormData = {
        amount: Number(data.amount),
        description: data.description.trim(),
        category: data.category || suggestedCategory || 'Other',
        merchant: data.merchant?.trim() || undefined,
        date: new Date(data.date).toISOString(),
        tags: data.tags || [],
      }

      if (isEditing && expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: formattedData,
        })
      } else {
        await createExpense.mutateAsync(formattedData)
      }

      onClose()
    } catch (error) {
      console.error('Error saving expense:', error)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      setValue('tags', [...watchedTags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleUseSuggestion = () => {
    setValue('category', suggestedCategory)
    setSuggestedCategory('')
    setCategoryConfidence(0)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header>
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </h2>
      </Modal.Header>

      <Modal.Content>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    error={!!errors.amount}
                  />
                )}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                leftIcon={<Calendar className="h-4 w-4" />}
                {...register('date')}
                error={!!errors.date}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <Input
              type="text"
              placeholder="What did you spend on?"
              leftIcon={<FileText className="h-4 w-4" />}
              {...register('description')}
              error={!!errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <Input
              type="text"
              placeholder="Store or business name"
              leftIcon={<Store className="h-4 w-4" />}
              {...register('merchant')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* AI Suggestion */}
            {suggestedCategory && suggestedCategory !== watch('category') && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">
                    💡 Suggested: <strong>{suggestedCategory}</strong>
                    {isCategorizingExpense && (
                      <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />
                    )}
                  </span>
                  {categoryConfidence > 0 && (
                    <span className="text-xs text-blue-600">
                      {Math.round(categoryConfidence * 100)}% confident
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseSuggestion}
                  className="mt-1 text-blue-600 hover:text-blue-800"
                >
                  Use suggestion
                </Button>
              </div>
            )}

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Add a tag"
                leftIcon={<Tag className="h-4 w-4" />}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>

            {/* Display Tags */}
            {watchedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {watchedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal.Content>

      <Modal.Footer>
        <div className="flex items-center justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting || createExpense.isLoading || updateExpense.isLoading}
          >
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

export default ExpenseForm