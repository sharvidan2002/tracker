import axios, { AxiosInstance } from 'axios'
import { config } from '../config/environment'
import { CategorizeResponse, MLServiceResponse } from '../types'

class MLService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: config.ML_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`ML Service Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('ML Service Request Error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        console.log(`ML Service Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('ML Service Response Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        })
        return Promise.reject(error)
      }
    )
  }

  async categorizeExpense(description: string, merchant?: string): Promise<CategorizeResponse> {
    try {
      const response = await this.client.post<MLServiceResponse>('/categorize', {
        description,
        merchant,
      })

      return {
        category: response.data.category,
        confidence: response.data.confidence,
      }
    } catch (error) {
      console.error('Failed to categorize expense:', error)

      // Fallback to rule-based categorization
      return this.fallbackCategorization(description, merchant)
    }
  }

  async bulkCategorize(expenses: Array<{ id: string; description: string; merchant?: string }>): Promise<Array<{ id: string; category: string; confidence: number }>> {
    try {
      const response = await this.client.post('/categorize/bulk', {
        expenses,
      })

      return response.data.results
    } catch (error) {
      console.error('Failed to bulk categorize expenses:', error)

      // Fallback to individual rule-based categorization
      return expenses.map(expense => ({
        id: expense.id,
        ...this.fallbackCategorization(expense.description, expense.merchant),
      }))
    }
  }

  async trainModel(trainingData: Array<{ description: string; merchant?: string; category: string }>): Promise<{ success: boolean; modelVersion: string }> {
    try {
      const response = await this.client.post('/train', {
        data: trainingData,
      })

      return response.data
    } catch (error) {
      console.error('Failed to train model:', error)
      throw new Error('Model training failed')
    }
  }

  async getModelInfo(): Promise<{ version: string; accuracy: number; lastTrained: string }> {
    try {
      const response = await this.client.get('/model/info')
      return response.data
    } catch (error) {
      console.error('Failed to get model info:', error)
      throw new Error('Failed to retrieve model information')
    }
  }

  async getSuggestions(description: string, merchant?: string): Promise<string[]> {
    try {
      const response = await this.client.post('/suggestions', {
        description,
        merchant,
      })

      return response.data.suggestions || []
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return []
    }
  }

  private fallbackCategorization(description: string, merchant?: string): CategorizeResponse {
    const desc = description.toLowerCase()
    const merch = merchant?.toLowerCase() || ''

    // Food & Dining
    if (this.matchesKeywords(desc, merch, [
      'restaurant', 'food', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast',
      'pizza', 'burger', 'sushi', 'bar', 'pub', 'grill', 'diner', 'kitchen',
      'mcdonald', 'subway', 'starbucks', 'kfc', 'taco', 'domino', 'chipotle'
    ])) {
      return { category: 'Food & Dining', confidence: 0.7 }
    }

    // Transportation
    if (this.matchesKeywords(desc, merch, [
      'gas', 'fuel', 'gasoline', 'uber', 'lyft', 'taxi', 'bus', 'train',
      'metro', 'subway', 'parking', 'toll', 'car', 'auto', 'repair',
      'shell', 'exxon', 'bp', 'chevron', 'mobil'
    ])) {
      return { category: 'Transportation', confidence: 0.7 }
    }

    // Shopping
    if (this.matchesKeywords(desc, merch, [
      'amazon', 'target', 'walmart', 'costco', 'shop', 'store', 'retail',
      'clothes', 'clothing', 'shoes', 'mall', 'purchase', 'buy',
      'ebay', 'etsy', 'best buy', 'home depot', 'lowes'
    ])) {
      return { category: 'Shopping', confidence: 0.7 }
    }

    // Entertainment
    if (this.matchesKeywords(desc, merch, [
      'movie', 'cinema', 'theater', 'netflix', 'spotify', 'games', 'gaming',
      'concert', 'show', 'event', 'ticket', 'entertainment', 'fun',
      'disney', 'hulu', 'youtube', 'steam', 'playstation', 'xbox'
    ])) {
      return { category: 'Entertainment', confidence: 0.7 }
    }

    // Bills & Utilities
    if (this.matchesKeywords(desc, merch, [
      'electric', 'electricity', 'water', 'gas', 'internet', 'phone',
      'cable', 'utility', 'bill', 'payment', 'insurance', 'rent',
      'verizon', 'att', 'comcast', 'xfinity', 'tmobile'
    ])) {
      return { category: 'Bills & Utilities', confidence: 0.7 }
    }

    // Healthcare
    if (this.matchesKeywords(desc, merch, [
      'doctor', 'hospital', 'medical', 'pharmacy', 'health', 'dental',
      'clinic', 'medicine', 'prescription', 'cvs', 'walgreens', 'rite aid'
    ])) {
      return { category: 'Healthcare', confidence: 0.7 }
    }

    // Travel
    if (this.matchesKeywords(desc, merch, [
      'hotel', 'flight', 'airline', 'travel', 'vacation', 'trip',
      'booking', 'airbnb', 'expedia', 'delta', 'united', 'american airlines'
    ])) {
      return { category: 'Travel', confidence: 0.7 }
    }

    // Education
    if (this.matchesKeywords(desc, merch, [
      'school', 'university', 'college', 'education', 'tuition', 'book',
      'course', 'class', 'training', 'learning'
    ])) {
      return { category: 'Education', confidence: 0.7 }
    }

    // Personal Care
    if (this.matchesKeywords(desc, merch, [
      'salon', 'spa', 'haircut', 'beauty', 'cosmetics', 'personal',
      'care', 'grooming', 'massage', 'nails'
    ])) {
      return { category: 'Personal Care', confidence: 0.7 }
    }

    // Business
    if (this.matchesKeywords(desc, merch, [
      'office', 'business', 'supplies', 'meeting', 'conference',
      'professional', 'work', 'staples', 'fedex', 'ups'
    ])) {
      return { category: 'Business', confidence: 0.7 }
    }

    // Default to Other
    return { category: 'Other', confidence: 0.3 }
  }

  private matchesKeywords(description: string, merchant: string, keywords: string[]): boolean {
    const text = `${description} ${merchant}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword))
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

export const mlService = new MLService()
export default mlService