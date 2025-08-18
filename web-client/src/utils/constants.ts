export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const ROUTES = {
  HOME: '/',
  EXPENSES: '/expenses',
  ANALYTICS: '/analytics',
  BUDGET: '/budget',
  LOGIN: '/login',
  REGISTER: '/register',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },
  EXPENSES: {
    LIST: '/api/expenses',
    CREATE: '/api/expenses',
    UPDATE: '/api/expenses',
    DELETE: '/api/expenses',
    CATEGORIZE: '/api/expenses/categorize',
  },
  BUDGET: {
    LIST: '/api/budget',
    CREATE: '/api/budget',
    UPDATE: '/api/budget',
    DELETE: '/api/budget',
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    TRENDS: '/api/analytics/trends',
    INSIGHTS: '/api/analytics/insights',
  },
} as const

export const EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍽️', color: '#000000' },
  { name: 'Transportation', icon: '🚗', color: '#404040' },
  { name: 'Shopping', icon: '🛍️', color: '#262626' },
  { name: 'Entertainment', icon: '🎬', color: '#525252' },
  { name: 'Bills & Utilities', icon: '💡', color: '#737373' },
  { name: 'Healthcare', icon: '🏥', color: '#a3a3a3' },
  { name: 'Travel', icon: '✈️', color: '#171717' },
  { name: 'Education', icon: '📚', color: '#0a0a0a' },
  { name: 'Personal Care', icon: '💄', color: '#404040' },
  { name: 'Gifts & Donations', icon: '🎁', color: '#525252' },
  { name: 'Business', icon: '💼', color: '#262626' },
  { name: 'Other', icon: '📝', color: '#737373' },
] as const

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'EEEE, MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

export const CHART_COLORS = {
  PRIMARY: '#000000',
  SECONDARY: '#404040',
  TERTIARY: '#737373',
  QUATERNARY: '#a3a3a3',
  LIGHT: '#d4d4d4',
  BACKGROUND: '#ffffff',
  BORDER: '#e5e5e5',
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_DESCRIPTION_LENGTH: 255,
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT: 0.01,
} as const

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'expense_tracker_token',
  USER_PREFERENCES: 'expense_tracker_preferences',
  DRAFT_EXPENSE: 'expense_tracker_draft',
} as const

export const QUERY_KEYS = {
  EXPENSES: 'expenses',
  EXPENSE: 'expense',
  CATEGORIES: 'categories',
  BUDGET: 'budget',
  ANALYTICS: 'analytics',
  USER: 'user',
  INSIGHTS: 'insights',
} as const

export const TOAST_DURATION = 3000

export const EXPENSE_TRENDS_COLORS = [
  '#000000',
  '#262626',
  '#404040',
  '#525252',
  '#737373',
  '#a3a3a3',
]

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const