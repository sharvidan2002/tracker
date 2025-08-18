import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign, FileText, Store, Calendar, Tag, Loader2 } from 'lucide-react'
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
      date: expense?.date ? formatDate(expense.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      tags: expense?.tags || defaultValues?.tags || [],
    },
  })

  const watchedDescription = watch('description')
  const watchedMerchant = watch('merchant')
  const watchedTags = watch('tags') || []

  // Auto-categorize when description changes
  useEffect(() => {
    if (watchedDescription && watchedDescription.length > 3 && !isEditing) {
      const timeoutId = setTimeout(() => {
        categorizeExpense.mutate(
          { description: watchedDescription, merchant: watchedMerchant },
          {
            onSuccess: (data) => {
              setSuggestedCategory(data.category)
              setCategoryConfidence(data.confidence)
              if (data.confidence > 0.8) {
                setValue('category', data.category)
              }
            },
          }
        )
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [watchedDescription, watchedMerchant, isEditing, categorizeExpense, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      const formattedData: ExpenseFormData = {
        ...data,
        tags: data.tags?.filter(tag => tag.trim() !== '') || [],
      }

      if (isEditing && expense) {
        await updateExpense.mutateAsync({ id: expense.id, data: formattedData })
      } else {
        await createExpense.mutateAsync(formattedData)
      }

      reset()
      onClose()
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()])
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense' : 'Add New Expense'}
      size="lg"
    >
      <Modal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              leftIcon={<DollarSign className="h-4 w-4" />}
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />

            <Input
              label="Date"
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              error={errors.date?.message}
              {...register('date')}
            />
          </div>

          <Input
            label="Description"
            type="text"
            placeholder="What did you spend on?"
            leftIcon={<FileText className="h-4 w-4" />}
            error={errors.description?.message}
            {...register('description')}
          />

          <Input
            label="Merchant"
            type="text"
            placeholder="Where did you spend? (optional)"
            leftIcon={<Store className="h-4 w-4" />}
            error={errors.merchant?.message}
            {...register('merchant')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              )}
            />

            {suggestedCategory && !isEditing && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    AI suggests: <strong>{suggestedCategory}</strong>
                    {categorizeExpense.isLoading && (
                      <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />
                    )}
                  </span>
                  {categoryConfidence > 0 && (
                    <span className="text-xs text-gray-500">
                      {Math.round(categoryConfidence * 100)}% confident
                    </span>
                  )}
                </div>
                {categoryConfidence < 0.8 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue('category', suggestedCategory)}
                    className="mt-1"
                  >
                    Use suggestion
                  </Button>
                )}
              </div>
            )}

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

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
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      ×
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