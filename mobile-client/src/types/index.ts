// Import shared types from the shared package (in a real app, you'd install this as a dependency)
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category?: string;
  merchant?: string;
  date: string;
  tags?: string[];
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category?: string;
  merchant?: string;
  date: string;
  tags?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  AddExpense: {
    defaultData?: Partial<CreateExpenseRequest>;
  };
  ExpenseDetail: {
    expenseId: string;
  };
  CameraScanner: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Expenses: undefined;
  AddExpense: undefined;
  Profile: undefined;
};

// Camera/Scanner Types
export interface ReceiptScanResult {
  amount?: number;
  merchant?: string;
  date?: string;
  items?: Array<{
    name: string;
    price: number;
  }>;
  confidence: number;
}

// Quick Add Types
export interface QuickExpense {
  amount: number;
  description: string;
  category?: string;
}

// App State Types
export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Form Types
export interface ExpenseFormData {
  amount: string;
  description: string;
  category: string;
  merchant: string;
  date: Date;
  tags: string[];
}

// Biometric Types
export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'faceId' | 'none';
}

// Notification Types
export interface NotificationConfig {
  budgetAlerts: boolean;
  dailyReminders: boolean;
  weeklyReports: boolean;
}

// Settings Types
export interface AppSettings {
  biometric: BiometricConfig;
  notifications: NotificationConfig;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

// Constants
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Business',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Colors
export const COLORS = {
  primary: '#000000',
  secondary: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;