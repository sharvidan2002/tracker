import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Expense,
  CreateExpenseRequest,
  AuthResponse,
  LoginRequest,
} from '../types';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001' // Development
  : 'https://your-api-domain.com'; // Production

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAuthToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && {Authorization: `Bearer ${token}`}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local storage
      await AsyncStorage.multiRemove(['authToken', 'user']);
    }
  }

  async getProfile(): Promise<User> {
    return this.makeRequest<User>('/api/auth/profile');
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.makeRequest('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Expenses
  async getExpenses(params: {
    page?: number;
    limit?: number;
    category?: string;
  } = {}): Promise<{data: Expense[]; pagination: any}> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);

    const query = searchParams.toString();
    const endpoint = `/api/expenses${query ? `?${query}` : ''}`;

    return this.makeRequest(endpoint);
  }

  async getExpense(id: string): Promise<Expense> {
    return this.makeRequest<Expense>(`/api/expenses/${id}`);
  }

  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    return this.makeRequest<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(
    id: string,
    expenseData: Partial<CreateExpenseRequest>,
  ): Promise<Expense> {
    return this.makeRequest<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    return this.makeRequest(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboard(): Promise<{
    totalSpent: number;
    recentExpenses: Expense[];
    monthlyTotal: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    // This combines multiple API calls to create a dashboard view
    try {
      const [expensesResponse, analyticsResponse] = await Promise.all([
        this.getExpenses({limit: 5}),
        this.makeRequest('/api/analytics/dashboard?period=month'),
      ]);

      return {
        totalSpent: analyticsResponse.totalSpent || 0,
        recentExpenses: expensesResponse.data || [],
        monthlyTotal: analyticsResponse.totalSpent || 0,
        categoryBreakdown: analyticsResponse.categoryBreakdown || [],
      };
    } catch (error) {
      console.error('Dashboard request failed:', error);
      throw error;
    }
  }

  // Analytics
  async getAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalSpent: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      date: string;
      amount: number;
    }>;
  }> {
    return this.makeRequest(`/api/analytics/dashboard?period=${period}`);
  }

  // ML/AI Services
  async categorizeExpense(
    description: string,
    merchant?: string,
  ): Promise<{category: string; confidence: number}> {
    return this.makeRequest('/api/expenses/categorize', {
      method: 'POST',
      body: JSON.stringify({description, merchant}),
    });
  }

  // Receipt Scanning (placeholder)
  async scanReceipt(imageUri: string): Promise<{
    amount?: number;
    merchant?: string;
    date?: string;
    items?: Array<{name: string; price: number}>;
  }> {
    // This would integrate with a receipt scanning service
    // For now, return empty results
    console.log('Receipt scanning not implemented:', imageUri);
    return {};
  }

  // File Upload
  async uploadReceipt(expenseId: string, imageUri: string): Promise<{receiptUrl: string}> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseURL}/api/expenses/${expenseId}/receipt`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && {Authorization: `Bearer ${token}`}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload receipt');
    }

    const data = await response.json();
    return data.data;
  }

  // Utility methods
  async ping(): Promise<boolean> {
    try {
      await fetch(`${this.baseURL}/health`);
      return true;
    } catch (error) {
      return false;
    }
  }

  setAuthToken(token: string): Promise<void> {
    return AsyncStorage.setItem('authToken', token);
  }

  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }
}

export const apiService = new ApiService();
export default apiService;