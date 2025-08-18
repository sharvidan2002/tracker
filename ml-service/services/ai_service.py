import os
import json
import requests
from datetime import datetime, timedelta
from config import Config

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("Google Generative AI not available. Using fallback insights.")

class AIService:
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        self.model = None

        if GENAI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
                print("Gemini AI initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Gemini AI: {e}")
                self.model = None
        else:
            print("Gemini AI not configured. Using fallback insights.")

    def generate_insights(self, user_id, expenses):
        """Generate AI-powered financial insights"""
        try:
            if self.model and len(expenses) > 0:
                return self._generate_ai_insights(expenses)
            else:
                return self._generate_fallback_insights(expenses)
        except Exception as e:
            print(f"Error generating insights: {e}")
            return self._generate_fallback_insights(expenses)

    def get_recommendations(self, user_id, expenses, budgets):
        """Get personalized financial recommendations"""
        try:
            if self.model:
                return self._generate_ai_recommendations(expenses, budgets)
            else:
                return self._generate_fallback_recommendations(expenses, budgets)
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return self._generate_fallback_recommendations(expenses, budgets)

    def _generate_ai_insights(self, expenses):
        """Generate insights using Gemini AI"""
        try:
            # Prepare expense summary
            total_spent = sum(exp.get('amount', 0) for exp in expenses)
            categories = {}
            merchants = {}

            for exp in expenses:
                category = exp.get('category', 'Other')
                merchant = exp.get('merchant', 'Unknown')
                amount = exp.get('amount', 0)

                categories[category] = categories.get(category, 0) + amount
                merchants[merchant] = merchants.get(merchant, 0) + amount

            # Get top categories and merchants
            top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
            top_merchants = sorted(merchants.items(), key=lambda x: x[1], reverse=True)[:5]

            # Create prompt
            prompt = f"""
Analyze the following spending data and provide 3-5 actionable financial insights:

Total Spent: ${total_spent:.2f}
Number of Transactions: {len(expenses)}

Top Categories:
{chr(10).join([f"- {cat}: ${amt:.2f}" for cat, amt in top_categories])}

Top Merchants:
{chr(10).join([f"- {merch}: ${amt:.2f}" for merch, amt in top_merchants])}

Please provide insights in JSON format with the following structure:
[
  {{
    "type": "tip|warning|achievement|recommendation",
    "title": "Brief title",
    "description": "Detailed insight",
    "impact": "low|medium|high",
    "actionable": true/false
  }}
]

Focus on:
1. Spending patterns and trends
2. Budget optimization opportunities
3. Unusual expenses
4. Positive behaviors to acknowledge
5. Specific actionable recommendations
"""

            response = self.model.generate_content(prompt)

            # Parse JSON response
            try:
                insights_data = json.loads(response.text)
                insights = []

                for i, insight in enumerate(insights_data):
                    insights.append({
                        'id': f'ai-insight-{datetime.now().timestamp()}-{i}',
                        'type': insight.get('type', 'tip'),
                        'title': insight.get('title', 'Financial Insight'),
                        'description': insight.get('description', ''),
                        'impact': insight.get('impact', 'medium'),
                        'actionable': insight.get('actionable', True),
                        'createdAt': datetime.now().isoformat()
                    })

                return insights

            except json.JSONDecodeError:
                # Fallback to text parsing
                return self._parse_text_insights(response.text)

        except Exception as e:
            print(f"AI insights generation failed: {e}")
            return self._generate_fallback_insights(expenses)

    def _generate_ai_recommendations(self, expenses, budgets):
        """Generate recommendations using Gemini AI"""
        try:
            # Prepare data summary
            total_spent = sum(exp.get('amount', 0) for exp in expenses)
            budget_summary = []

            for budget in budgets:
                budget_summary.append({
                    'category': budget.get('category'),
                    'budget': budget.get('amount', 0),
                    'spent': budget.get('spent', 0),
                    'remaining': budget.get('remaining', 0)
                })

            prompt = f"""
Based on the following financial data, provide 3-5 specific recommendations:

Total Recent Spending: ${total_spent:.2f}
Number of Transactions: {len(expenses)}

Current Budgets:
{chr(10).join([f"- {b['category']}: Budget ${b['budget']:.2f}, Spent ${b['spent']:.2f}, Remaining ${b['remaining']:.2f}" for b in budget_summary])}

Provide recommendations as a JSON array of strings, focusing on:
1. Budget adjustments based on actual spending
2. Areas to reduce expenses
3. Financial goals and savings opportunities
4. Spending habit improvements
5. Category-specific advice

Example format: ["Recommendation 1", "Recommendation 2", ...]
"""

            response = self.model.generate_content(prompt)

            try:
                recommendations = json.loads(response.text)
                return recommendations if isinstance(recommendations, list) else []
            except json.JSONDecodeError:
                # Extract recommendations from text
                lines = response.text.split('\n')
                recommendations = []
                for line in lines:
                    line = line.strip()
                    if line and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                        clean_line = line.lstrip('-•0123456789. ').strip()
                        if clean_line:
                            recommendations.append(clean_line)
                return recommendations[:5]

        except Exception as e:
            print(f"AI recommendations generation failed: {e}")
            return self._generate_fallback_recommendations(expenses, budgets)

    def _parse_text_insights(self, text):
        """Parse insights from text response"""
        insights = []
        lines = text.split('\n')

        current_insight = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.lower().startswith(('tip:', 'warning:', 'achievement:', 'recommendation:')):
                if current_insight:
                    insights.append(self._format_insight(current_insight))
                current_insight = {'type': line.split(':')[0].lower(), 'content': line.split(':', 1)[1].strip()}
            elif current_insight:
                current_insight['content'] += ' ' + line

        if current_insight:
            insights.append(self._format_insight(current_insight))

        return insights[:5]

    def _format_insight(self, insight_data):
        """Format insight data"""
        content = insight_data.get('content', '')
        return {
            'id': f'ai-insight-{datetime.now().timestamp()}',
            'type': insight_data.get('type', 'tip'),
            'title': content[:50] + '...' if len(content) > 50 else content,
            'description': content,
            'impact': 'medium',
            'actionable': True,
            'createdAt': datetime.now().isoformat()
        }

    def _generate_fallback_insights(self, expenses):
        """Generate basic insights without AI"""
        insights = []

        if not expenses:
            return [{
                'id': f'fallback-{datetime.now().timestamp()}',
                'type': 'tip',
                'title': 'Start Tracking Expenses',
                'description': 'Begin by adding your daily expenses to get personalized insights.',
                'impact': 'low',
                'actionable': True,
                'createdAt': datetime.now().isoformat()
            }]

        total_spent = sum(exp.get('amount', 0) for exp in expenses)

        # High spending warning
        if total_spent > 1000:
            insights.append({
                'id': f'fallback-{datetime.now().timestamp()}-1',
                'type': 'warning',
                'title': 'High Spending Detected',
                'description': f'You\'ve spent ${total_spent:.2f} recently. Consider reviewing your largest expenses.',
                'impact': 'high',
                'actionable': True,
                'createdAt': datetime.now().isoformat()
            })

        # Category analysis
        categories = {}
        for exp in expenses:
            category = exp.get('category', 'Other')
            categories[category] = categories.get(category, 0) + exp.get('amount', 0)

        if categories:
            top_category, top_amount = max(categories.items(), key=lambda x: x[1])
            insights.append({
                'id': f'fallback-{datetime.now().timestamp()}-2',
                'type': 'tip',
                'title': f'{top_category} is Your Top Expense',
                'description': f'You\'ve spent ${top_amount:.2f} on {top_category}. Look for optimization opportunities in this category.',
                'impact': 'medium',
                'actionable': True,
                'createdAt': datetime.now().isoformat()
            })

        # Frequent small transactions
        small_transactions = [exp for exp in expenses if exp.get('amount', 0) < 10]
        if len(small_transactions) > len(expenses) * 0.3:
            insights.append({
                'id': f'fallback-{datetime.now().timestamp()}-3',
                'type': 'tip',
                'title': 'Many Small Purchases',
                'description': 'You have many small transactions. These can add up quickly - consider tracking daily coffee or snack expenses.',
                'impact': 'medium',
                'actionable': True,
                'createdAt': datetime.now().isoformat()
            })

        return insights

    def _generate_fallback_recommendations(self, expenses, budgets):
        """Generate basic recommendations without AI"""
        recommendations = []

        if not budgets:
            recommendations.append("Start by setting budgets for your top 3 spending categories")

        # Analyze spending vs budgets
        for budget in budgets:
            if budget.get('spent', 0) > budget.get('amount', 0):
                category = budget.get('category', 'Unknown')
                overspent = budget.get('spent', 0) - budget.get('amount', 0)
                recommendations.append(f"You're ${overspent:.2f} over budget for {category}. Consider reducing spending in this category.")

        # General advice
        recommendations.extend([
            "Review and cancel unused subscriptions to reduce monthly expenses",
            "Use the 24-hour rule for non-essential purchases over $50",
            "Set up automatic savings transfers to build an emergency fund",
            "Track daily coffee and small purchases - they add up quickly",
            "Consider meal planning to reduce food expenses"
        ])

        return recommendations[:5]