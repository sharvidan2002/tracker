import axios, { AxiosInstance } from 'axios'
import { config } from '../config/environment'
import { AIInsight, ExpenseResponse } from '../types'
import { Expense } from '../models/Expense'

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string
    }>
  }>
  generationConfig: {
    temperature: number
    topK: number
    topP: number
    maxOutputTokens: number
  }
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

class AIService {
  private client: AxiosInstance
  private readonly apiKey: string

  constructor() {
    this.apiKey = config.GEMINI_API_KEY || ''

    this.client = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Gemini API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('Gemini API Request Error:', error)
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        console.log(`Gemini API Response: ${response.status}`)
        return response
      },
      (error) => {
        console.error('Gemini API Response Error:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
        })
        return Promise.reject(error)
      }
    )
  }

  async generateInsights(userId: string, expenses: any[]): Promise<AIInsight[]> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured, using fallback insights')
      return this.generateFallbackInsights(expenses)
    }

    try {
      const analysisPrompt = this.buildAnalysisPrompt(expenses)
      const response = await this.callGeminiAPI(analysisPrompt)

      return this.parseInsightsFromResponse(response)
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
      return this.generateFallbackInsights(expenses)
    }
  }

  async generateBudgetRecommendations(userId: string, currentBudgets: any[], expenses: any[]): Promise<string[]> {
    if (!this.apiKey) {
      return this.generateFallbackBudgetRecommendations(currentBudgets, expenses)
    }

    try {
      const prompt = this.buildBudgetRecommendationPrompt(currentBudgets, expenses)
      const response = await this.callGeminiAPI(prompt)

      return this.parseRecommendationsFromResponse(response)
    } catch (error) {
      console.error('Failed to generate budget recommendations:', error)
      return this.generateFallbackBudgetRecommendations(currentBudgets, expenses)
    }
  }

  async generateSpendingAdvice(categoryData: any[], monthlyTrend: any[]): Promise<string[]> {
    if (!this.apiKey) {
      return this.generateFallbackSpendingAdvice(categoryData, monthlyTrend)
    }

    try {
      const prompt = this.buildSpendingAdvicePrompt(categoryData, monthlyTrend)
      const response = await this.callGeminiAPI(prompt)

      return this.parseAdviceFromResponse(response)
    } catch (error) {
      console.error('Failed to generate spending advice:', error)
      return this.generateFallbackSpendingAdvice(categoryData, monthlyTrend)
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    const response = await this.client.post<GeminiResponse>(
      `/models/gemini-pro:generateContent?key=${this.apiKey}`,
      request
    )

    return response.data.candidates[0]?.content?.parts[0]?.text || ''
  }

  private buildAnalysisPrompt(expenses: any[]): string {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const categories = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {})

    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)

    return `
Analyze the following spending data and provide 3-5 actionable financial insights in JSON format:

Total Spent: $${totalSpent.toFixed(2)}
Number of Transactions: ${expenses.length}
Top Categories: ${topCategories.map(([cat, amount]) => `${cat}: $${(amount as number).toFixed(2)}`).join(', ')}

Recent Transactions (last 10):
${expenses.slice(0, 10).map(exp => `- $${exp.amount.toFixed(2)} at ${exp.merchant || 'Unknown'} (${exp.category})`).join('\n')}

Please respond with a JSON array of insights, each with:
- id: unique identifier
- type: "tip" | "warning" | "achievement" | "recommendation"
- title: short descriptive title
- description: detailed insight (1-2 sentences)
- impact: "low" | "medium" | "high"
- actionable: boolean
- category: relevant expense category if applicable

Focus on:
1. Spending patterns and trends
2. Budget optimization opportunities
3. Unusual or concerning expenses
4. Positive spending behaviors to acknowledge
5. Specific actionable recommendations
`
  }

  private buildBudgetRecommendationPrompt(budgets: any[], expenses: any[]): string {
    const categorySpending = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {})

    return `
Based on the following spending data and current budgets, provide 3-5 budget recommendations as a JSON array of strings:

Current Budgets:
${budgets.map(b => `- ${b.category}: $${b.amount} (spent: $${b.spent})`).join('\n')}

Actual Spending by Category:
${Object.entries(categorySpending).map(([cat, amount]) => `- ${cat}: $${(amount as number).toFixed(2)}`).join('\n')}

Provide specific, actionable budget recommendations focusing on:
1. Adjusting budget amounts based on actual spending
2. Creating budgets for categories without limits
3. Strategies to reduce overspending
4. Optimizing budget allocations
`
  }

  private buildSpendingAdvicePrompt(categoryData: any[], trends: any[]): string {
    return `
Analyze this spending data and provide 3-5 pieces of practical financial advice as a JSON array of strings:

Category Breakdown:
${categoryData.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`).join('\n')}

Recent Spending Trend:
${trends.slice(-7).map(t => `- ${t.date}: $${t.amount.toFixed(2)}`).join('\n')}

Focus on practical advice for:
1. Reducing expenses in high-spending categories
2. Building better spending habits
3. Identifying opportunities for savings
4. Warning about potential financial risks
`
  }

  private parseInsightsFromResponse(response: string): AIInsight[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/m)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        return insights.map((insight: any, index: number) => ({
          id: insight.id || `ai-insight-${Date.now()}-${index}`,
          type: insight.type || 'tip',
          title: insight.title || 'Financial Insight',
          description: insight.description || '',
          category: insight.category,
          impact: insight.impact || 'medium',
          actionable: insight.actionable !== false,
          createdAt: new Date().toISOString(),
        }))
      }
    } catch (error) {
      console.error('Failed to parse AI insights:', error)
    }

    // Fallback parsing
    return this.generateFallbackInsights([])
  }

  private parseRecommendationsFromResponse(response: string): string[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/m)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Failed to parse recommendations:', error)
    }

    // Fallback to extracting bullet points
    const lines = response.split('\n').filter(line => line.trim().length > 0)
    return lines.slice(0, 5).map(line => line.replace(/^[-*•]\s*/, '').trim())
  }

  private parseAdviceFromResponse(response: string): string[] {
    return this.parseRecommendationsFromResponse(response)
  }

  private generateFallbackInsights(expenses: any[]): AIInsight[] {
    const insights: AIInsight[] = []

    if (expenses.length === 0) {
      return [
        {
          id: `fallback-${Date.now()}-1`,
          type: 'tip',
          title: 'Start Tracking Your Expenses',
          description: 'Begin by adding your daily expenses to get personalized insights.',
          impact: 'low',
          actionable: true,
          createdAt: new Date().toISOString(),
        }
      ]
    }

    // High spending insight
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    if (totalSpent > 1000) {
      insights.push({
        id: `fallback-${Date.now()}-1`,
        type: 'warning',
        title: 'High Monthly Spending',
        description: `You've spent $${totalSpent.toFixed(2)} recently. Consider reviewing your largest expenses.`,
        impact: 'high',
        actionable: true,
        createdAt: new Date().toISOString(),
      })
    }

    // Frequent small transactions
    const smallTransactions = expenses.filter(exp => exp.amount < 10).length
    if (smallTransactions > expenses.length * 0.3) {
      insights.push({
        id: `fallback-${Date.now()}-2`,
        type: 'tip',
        title: 'Frequent Small Purchases',
        description: 'Many small purchases can add up. Consider tracking daily coffee or snack expenses.',
        impact: 'medium',
        actionable: true,
        createdAt: new Date().toISOString(),
      })
    }

    return insights
  }

  private generateFallbackBudgetRecommendations(budgets: any[], expenses: any[]): string[] {
    const recommendations = []

    if (budgets.length === 0) {
      recommendations.push('Start by setting budgets for your top 3 spending categories')
    }

    const categorySpending = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {})

    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)

    topCategories.forEach(([category, amount]) => {
      const budget = budgets.find(b => b.category === category)
      if (!budget) {
        recommendations.push(`Consider setting a budget for ${category} (currently spending $${(amount as number).toFixed(2)})`)
      } else if (budget.spent > budget.amount) {
        recommendations.push(`You're over budget for ${category}. Consider reducing spending or adjusting the budget.`)
      }
    })

    return recommendations.slice(0, 5)
  }

  private generateFallbackSpendingAdvice(categoryData: any[], trends: any[]): string[] {
    const advice = []

    if (categoryData.length > 0) {
      const topCategory = categoryData[0]
      advice.push(`${topCategory.category} is your largest expense category. Look for ways to optimize spending here.`)
    }

    if (trends.length > 7) {
      const recentSpending = trends.slice(-7).reduce((sum, t) => sum + t.amount, 0)
      const avgDaily = recentSpending / 7
      advice.push(`Your average daily spending is $${avgDaily.toFixed(2)}. Try to stay below this amount.`)
    }

    advice.push('Set up automatic savings transfers to build an emergency fund.')
    advice.push('Review and cancel unused subscriptions to reduce monthly expenses.')
    advice.push('Use the 24-hour rule for non-essential purchases over $50.')

    return advice.slice(0, 5)
  }

  async ping(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      await this.callGeminiAPI('Hello, please respond with "OK"')
      return true
    } catch (error) {
      return false
    }
  }
}

export const aiService = new AIService()
export default aiService