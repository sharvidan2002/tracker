import { format, formatDistance, parseISO, isValid, startOfDay, endOfDay } from 'date-fns'

// Currency Formatting
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount)
  } catch (error) {
    console.warn('Currency formatting failed:', error)
    return `$${amount.toFixed(2)}`
  }
}

export const formatCurrencyCompact = (amount: number, currency = 'USD', locale = 'en-US'): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }

  try {
    return new Intl.NumberFormat(locale, options).format(amount)
  } catch (error) {
    console.warn('Compact currency formatting failed:', error)

    // Fallback to manual compact formatting
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    } else {
      return `$${amount.toFixed(2)}`
    }
  }
}

export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and formatting
  const cleanString = currencyString.replace(/[$,\s]/g, '')
  const amount = parseFloat(cleanString)
  return isNaN(amount) ? 0 : amount
}

// Number Formatting
export const formatNumber = (
  num: number,
  locale = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    return new Intl.NumberFormat(locale, options).format(num)
  } catch (error) {
    console.warn('Number formatting failed:', error)
    return num.toString()
  }
}

export const formatPercentage = (
  value: number,
  decimals = 1,
  locale = 'en-US'
): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }

  try {
    return new Intl.NumberFormat(locale, options).format(value / 100)
  } catch (error) {
    console.warn('Percentage formatting failed:', error)
    return `${value.toFixed(decimals)}%`
  }
}

export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  if (bytes === 0) return '0 B'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

// Date Formatting
export const formatDate = (
  date: string | Date,
  formatStr = 'MMM dd, yyyy',
  fallback = 'Invalid Date'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date

    if (!isValid(dateObj)) {
      return fallback
    }

    return format(dateObj, formatStr)
  } catch (error) {
    console.warn('Date formatting failed:', error)
    return fallback
  }
}

export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date

    if (!isValid(dateObj)) {
      return 'Invalid date'
    }

    return formatDistance(dateObj, new Date(), { addSuffix: true })
  } catch (error) {
    console.warn('Relative date formatting failed:', error)
    return 'Unknown'
  }
}

export const formatDateTime = (
  date: string | Date,
  options: {
    includeTime?: boolean
    timeFormat?: '12' | '24'
    locale?: string
  } = {}
): string => {
  const { includeTime = true, timeFormat = '12', locale = 'en-US' } = options

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date

    if (!isValid(dateObj)) {
      return 'Invalid date'
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }

    if (includeTime) {
      formatOptions.hour = 'numeric'
      formatOptions.minute = '2-digit'
      formatOptions.hour12 = timeFormat === '12'
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
  } catch (error) {
    console.warn('DateTime formatting failed:', error)
    return formatDate(date)
  }
}

export const getDateRange = (period: 'week' | 'month' | 'year' | 'day'): { start: Date; end: Date } => {
  const now = new Date()
  const start = new Date()
  const end = new Date()

  switch (period) {
    case 'day':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      }
    case 'week':
      start.setDate(now.getDate() - now.getDay())
      end.setDate(start.getDate() + 6)
      break
    case 'month':
      start.setDate(1)
      end.setMonth(start.getMonth() + 1, 0)
      break
    case 'year':
      start.setMonth(0, 1)
      end.setMonth(11, 31)
      break
  }

  return {
    start: startOfDay(start),
    end: endOfDay(end)
  }
}

// Text Formatting
export const formatCategoryName = (category: string): string => {
  return category
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const formatMerchantName = (merchant: string): string => {
  // Clean up merchant names
  return merchant
    .replace(/\b(LLC|INC|CORP|LTD|CO)\b/gi, '')
    .replace(/[*#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

export const generateInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}`
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Array and Object Formatting
export const formatList = (
  items: string[],
  options: {
    conjunction?: 'and' | 'or'
    limit?: number
    moreText?: string
  } = {}
): string => {
  const { conjunction = 'and', limit, moreText = 'more' } = options

  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  let displayItems = items
  let hasMore = false

  if (limit && items.length > limit) {
    displayItems = items.slice(0, limit)
    hasMore = true
  }

  if (displayItems.length === 1) {
    return hasMore
      ? `${displayItems[0]} ${conjunction} ${items.length - 1} ${moreText}`
      : displayItems[0]
  }

  const lastItem = displayItems.pop()
  const result = `${displayItems.join(', ')} ${conjunction} ${lastItem}`

  if (hasMore) {
    const remainingCount = items.length - limit!
    return `${result} ${conjunction} ${remainingCount} ${moreText}`
  }

  return result
}

// Validation Helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

// Utility Functions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const roundToDecimalPlaces = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export const generateRandomId = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T

  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

export const groupBy = <T, K extends keyof any>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<K, T[]>)
}