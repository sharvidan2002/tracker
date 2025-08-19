import { format, formatDistanceToNow, parseISO, isValid, differenceInDays, addDays, startOfDay, endOfDay } from 'date-fns'

// Currency Formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    })
    return formatter.format(amount)
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    return `$${amount.toFixed(2)}`
  }
}

export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation: 'compact',
      compactDisplay: 'short',
    })
    return formatter.format(amount)
  } catch (error) {
    // Manual compact formatting
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(2)}`
  }
}

export const parseCurrency = (value: string): number => {
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[$£€¥₹₽¢,\s]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// Number Formatting
export const formatNumber = (
  value: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    })
    return formatter.format(value)
  } catch (error) {
    return value.toLocaleString()
  }
}

export const formatPercentage = (
  value: number,
  locale: string = 'en-US',
  decimals: number = 1
): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return formatter.format(value / 100)
  } catch (error) {
    return `${value.toFixed(decimals)}%`
  }
}

export const formatCompactNumber = (value: number, locale: string = 'en-US'): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
    })
    return formatter.format(value)
  } catch (error) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }
}

// Date Formatting
export const formatDate = (
  date: Date | string | number,
  formatString: string = 'MMM dd, yyyy',
  options?: { locale?: Locale }
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (!isValid(dateObj)) {
      return 'Invalid Date'
    }
    return format(dateObj, formatString, options)
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatDateTime = (
  date: Date | string | number,
  formatString: string = 'MMM dd, yyyy HH:mm',
  options?: { locale?: Locale }
): string => {
  return formatDate(date, formatString, options)
}

export const formatRelativeTime = (
  date: Date | string | number,
  options?: { addSuffix?: boolean; locale?: Locale }
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (!isValid(dateObj)) {
      return 'Invalid Date'
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, ...options })
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  formatString: string = 'MMM dd'
): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

    if (!isValid(start) || !isValid(end)) {
      return 'Invalid Date Range'
    }

    const startFormatted = format(start, formatString)
    const endFormatted = format(end, formatString)

    // If same date, return single date
    if (startFormatted === endFormatted) {
      return startFormatted
    }

    // If same year, omit year from start date
    if (start.getFullYear() === end.getFullYear()) {
      const startWithoutYear = format(start, 'MMM dd')
      const endWithYear = format(end, 'MMM dd, yyyy')
      return `${startWithoutYear} - ${endWithYear}`
    }

    return `${startFormatted} - ${endFormatted}`
  } catch (error) {
    return 'Invalid Date Range'
  }
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

// Text Formatting
export const formatName = (firstName: string, lastName: string): string => {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (first && last) {
    return `${first} ${last}`
  } else if (first) {
    return first
  } else if (last) {
    return last
  }

  return 'Unknown User'
}

export const formatInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.trim()?.[0]?.toUpperCase() || ''
  const last = lastName?.trim()?.[0]?.toUpperCase() || ''

  if (first && last) {
    return `${first}${last}`
  } else if (first) {
    return first
  } else if (last) {
    return last
  }

  return '??'
}

export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.slice(0, maxLength - suffix.length)
  return `${truncated}${suffix}`
}

export const capitalizeFirst = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const capitalizeWords = (text: string): string => {
  if (!text) return ''
  return text
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ')
}

export const formatCamelCase = (text: string): string => {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export const formatKebabCase = (text: string): string => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export const formatSnakeCase = (text: string): string => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

// File Size Formatting
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// Phone Number Formatting
export const formatPhoneNumber = (phoneNumber: string, country: string = 'US'): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')

  if (country === 'US') {
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    }
  }

  // Generic formatting for other countries
  if (digits.length > 10) {
    return `+${digits.slice(0, -10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }

  return phoneNumber // Return original if no formatting applies
}

// Address Formatting
export const formatAddress = (address: {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}): string => {
  const parts = []

  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)
  if (address.country) parts.push(address.country)

  return parts.join(', ')
}

// List Formatting
export const formatList = (
  items: string[],
  conjunction: string = 'and',
  maxItems?: number
): string => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  let displayItems = items
  let moreText = ''

  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems)
    const remainingCount = items.length - maxItems
    moreText = ` ${conjunction} ${remainingCount} more`
  }

  if (displayItems.length === 2) {
    return `${displayItems[0]} ${conjunction} ${displayItems[1]}${moreText}`
  }

  const lastItem = displayItems.pop()
  const result = `${displayItems.join(', ')}, ${conjunction} ${lastItem}`

  if (moreText) {
    return `${result}${moreText}`
  }

  return result
}

export const formatTagList = (
  tags: string[],
  maxTags: number = 3,
  moreText: string = 'more'
): string => {
  if (tags.length === 0) return ''
  if (tags.length <= maxTags) return tags.join(', ')

  const displayTags = tags.slice(0, maxTags)
  const remainingCount = tags.length - maxTags

  return `${displayTags.join(', ')} and ${remainingCount} ${moreText}`
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

export const isValidCreditCard = (number: string): boolean => {
  // Luhn algorithm
  const digits = number.replace(/\D/g, '')
  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0 && digits.length >= 13 && digits.length <= 19
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

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => any,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aValue = keyFn(a)
    const bValue = keyFn(b)

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export const unique = <T>(array: T[], keyFn?: (item: T) => any): T[] => {
  if (!keyFn) {
    return [...new Set(array)]
  }

  const seen = new Set()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// Color Formatting
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export const getContrastColor = (backgroundColor: string): 'black' | 'white' => {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return 'black'

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? 'black' : 'white'
}