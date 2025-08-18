-- Sample Data for Expense Tracker Database
-- This file contains sample data for testing and development

-- Sample users (passwords are bcrypt hashed versions of 'password123')
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    is_active,
    email_verified,
    currency,
    timezone
) VALUES
    ('john.doe@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwvHxVL4qlnp.Fi', 'John', 'Doe', true, true, 'USD', 'America/New_York'),
    ('jane.smith@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwvHxVL4qlnp.Fi', 'Jane', 'Smith', true, true, 'USD', 'America/Los_Angeles'),
    ('mike.johnson@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwvHxVL4qlnp.Fi', 'Mike', 'Johnson', true, true, 'USD', 'America/Chicago'),
    ('sarah.wilson@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwvHxVL4qlnp.Fi', 'Sarah', 'Wilson', true, true, 'EUR', 'Europe/London'),
    ('demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwvHxVL4qlnp.Fi', 'Demo', 'User', true, true, 'USD', 'UTC')
ON CONFLICT (email) DO NOTHING;

-- Sample user preferences
INSERT INTO user_preferences (user_id, notifications, privacy, ui_preferences)
SELECT
    u.id,
    '{"email": true, "push": true, "budgetAlerts": true, "weeklyReports": true, "monthlyReports": true}',
    '{"shareAnalytics": false, "showInLeaderboards": false}',
    '{"theme": "light", "dateFormat": "MM/DD/YYYY", "timeFormat": "12h"}'
FROM users u
WHERE u.email IN ('john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com', 'sarah.wilson@example.com', 'demo@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Sample budgets for John Doe
INSERT INTO budgets (
    user_id,
    name,
    category,
    amount,
    spent,
    period,
    start_date,
    end_date,
    alert_threshold,
    description
)
SELECT
    u.id,
    'Food & Dining Budget',
    'Food & Dining',
    800.00,
    245.50,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    80,
    'Monthly budget for restaurant meals and groceries'
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'Transportation Budget',
    'Transportation',
    300.00,
    150.75,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    75,
    'Gas, rideshare, and public transportation'
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'Entertainment Budget',
    'Entertainment',
    200.00,
    85.20,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    80,
    'Movies, games, and leisure activities'
FROM users u WHERE u.email = 'john.doe@example.com';

-- Sample budgets for Jane Smith
INSERT INTO budgets (
    user_id,
    name,
    category,
    amount,
    spent,
    period,
    start_date,
    end_date,
    alert_threshold
)
SELECT
    u.id,
    'Shopping Budget',
    'Shopping',
    500.00,
    320.00,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    85
FROM users u WHERE u.email = 'jane.smith@example.com'
UNION ALL
SELECT
    u.id,
    'Healthcare Budget',
    'Healthcare',
    150.00,
    45.00,
    'monthly',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    70
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Sample budget alerts
INSERT INTO budget_alerts (
    budget_id,
    user_id,
    alert_type,
    title,
    message,
    severity,
    threshold_percentage,
    current_amount,
    budget_amount
)
SELECT
    b.id,
    b.user_id,
    'approaching_limit',
    'Food Budget Alert',
    'You have spent 82% of your monthly food budget. Consider tracking your remaining expenses carefully.',
    'medium',
    80,
    b.spent,
    b.amount
FROM budgets b
JOIN users u ON b.user_id = u.id
WHERE u.email = 'john.doe@example.com' AND b.category = 'Food & Dining'
UNION ALL
SELECT
    b.id,
    b.user_id,
    'exceeded_budget',
    'Shopping Budget Exceeded',
    'You have exceeded your monthly shopping budget by $20. Consider adjusting your spending or increasing the budget.',
    'high',
    100,
    b.spent,
    b.amount
FROM budgets b
JOIN users u ON b.user_id = u.id
WHERE u.email = 'jane.smith@example.com' AND b.category = 'Shopping';

-- Sample financial goals
INSERT INTO financial_goals (
    user_id,
    goal_type,
    title,
    description,
    target_amount,
    current_amount,
    target_date,
    auto_contribution
)
SELECT
    u.id,
    'emergency_fund',
    'Emergency Fund',
    'Build an emergency fund covering 6 months of expenses',
    6000.00,
    1250.00,
    (CURRENT_DATE + INTERVAL '12 months')::DATE,
    500.00
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'savings_target',
    'Vacation Fund',
    'Save for a summer vacation to Europe',
    3000.00,
    750.00,
    (CURRENT_DATE + INTERVAL '8 months')::DATE,
    300.00
FROM users u WHERE u.email = 'jane.smith@example.com'
UNION ALL
SELECT
    u.id,
    'debt_payoff',
    'Credit Card Payoff',
    'Pay off remaining credit card debt',
    2500.00,
    500.00,
    (CURRENT_DATE + INTERVAL '10 months')::DATE,
    250.00
FROM users u WHERE u.email = 'mike.johnson@example.com';

-- Sample goal progress
INSERT INTO goal_progress (goal_id, amount, progress_type, description)
SELECT
    fg.id,
    250.00,
    'contribution',
    'Monthly automatic contribution'
FROM financial_goals fg
JOIN users u ON fg.user_id = u.id
WHERE u.email = 'john.doe@example.com' AND fg.goal_type = 'emergency_fund'
UNION ALL
SELECT
    fg.id,
    150.00,
    'contribution',
    'Weekly savings deposit'
FROM financial_goals fg
JOIN users u ON fg.user_id = u.id
WHERE u.email = 'jane.smith@example.com' AND fg.goal_type = 'savings_target';

-- Sample AI insights
INSERT INTO ai_insights (
    user_id,
    insight_type,
    title,
    description,
    category,
    confidence_score,
    impact_level,
    actionable,
    amount_related,
    date_range_start,
    date_range_end
)
SELECT
    u.id,
    'spending_pattern',
    'Increased Dining Expenses',
    'Your dining expenses have increased by 25% compared to last month. Consider meal planning to reduce costs.',
    'Food & Dining',
    0.87,
    'medium',
    true,
    245.50,
    (CURRENT_DATE - INTERVAL '30 days')::DATE,
    CURRENT_DATE
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'budget_recommendation',
    'Adjust Shopping Budget',
    'Based on your spending patterns, consider increasing your shopping budget by $100 or reducing discretionary purchases.',
    'Shopping',
    0.92,
    'high',
    true,
    320.00,
    (CURRENT_DATE - INTERVAL '30 days')::DATE,
    CURRENT_DATE
FROM users u WHERE u.email = 'jane.smith@example.com'
UNION ALL
SELECT
    u.id,
    'saving_opportunity',
    'Subscription Optimization',
    'You have multiple streaming subscriptions costing $45/month. Consider consolidating to save $20/month.',
    'Entertainment',
    0.75,
    'medium',
    true,
    45.00,
    (CURRENT_DATE - INTERVAL '90 days')::DATE,
    CURRENT_DATE
FROM users u WHERE u.email = 'mike.johnson@example.com';

-- Sample spending patterns
INSERT INTO spending_patterns (
    user_id,
    pattern_type,
    pattern_name,
    description,
    category,
    frequency,
    confidence_score,
    average_amount,
    min_amount,
    max_amount,
    occurrence_count,
    first_occurrence,
    last_occurrence
)
SELECT
    u.id,
    'weekly_cycle',
    'Weekend Dining',
    'Higher dining expenses on weekends, particularly Saturday evenings',
    'Food & Dining',
    'weekly',
    0.89,
    75.00,
    45.00,
    120.00,
    12,
    (CURRENT_DATE - INTERVAL '3 months')::DATE,
    (CURRENT_DATE - INTERVAL '1 week')::DATE
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'monthly_cycle',
    'Payday Shopping',
    'Increased shopping activity within 3 days of paycheck deposit',
    'Shopping',
    'monthly',
    0.82,
    200.00,
    80.00,
    350.00,
    6,
    (CURRENT_DATE - INTERVAL '6 months')::DATE,
    (CURRENT_DATE - INTERVAL '2 weeks')::DATE
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Sample user reports
INSERT INTO user_reports (
    user_id,
    report_type,
    title,
    description,
    period_start,
    period_end,
    report_data,
    is_automated
)
SELECT
    u.id,
    'monthly_summary',
    'October 2024 Expense Summary',
    'Automated monthly expense and budget summary',
    '2024-10-01'::DATE,
    '2024-10-31'::DATE,
    '{"totalSpent": 1245.75, "budgetUtilization": 78.5, "topCategories": ["Food & Dining", "Transportation", "Entertainment"], "savingsRate": 22.3}',
    true
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'budget_performance',
    'Q4 2024 Budget Performance',
    'Quarterly budget performance analysis',
    '2024-10-01'::DATE,
    '2024-12-31'::DATE,
    '{"budgetsOnTrack": 3, "budgetsOverspent": 1, "totalSavings": 456.78, "averageUtilization": 82.1}',
    false
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Sample analytics cache entries
INSERT INTO analytics_cache (
    user_id,
    cache_key,
    cache_data,
    period_type,
    period_start,
    period_end,
    record_count,
    computation_time_ms,
    expires_at
)
SELECT
    u.id,
    'monthly_category_breakdown',
    '{"categories": [{"name": "Food & Dining", "amount": 245.50, "percentage": 35.2}, {"name": "Transportation", "amount": 150.75, "percentage": 21.6}, {"name": "Entertainment", "amount": 85.20, "percentage": 12.2}], "total": 697.85}',
    'month',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,
    45,
    234,
    (CURRENT_TIMESTAMP + INTERVAL '1 hour')
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'weekly_spending_trend',
    '{"trend": [{"week": "2024-W42", "amount": 167.45}, {"week": "2024-W43", "amount": 189.20}, {"week": "2024-W44", "amount": 145.80}], "average": 167.48}',
    'week',
    (CURRENT_DATE - INTERVAL '3 weeks')::DATE,
    CURRENT_DATE,
    78,
    156,
    (CURRENT_TIMESTAMP + INTERVAL '2 hours')
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Update budget spent amounts based on some sample calculations
UPDATE budgets SET spent = amount * 0.65 WHERE category = 'Transportation';
UPDATE budgets SET spent = amount * 0.45 WHERE category = 'Entertainment';
UPDATE budgets SET spent = amount * 0.85 WHERE category = 'Healthcare';

-- Create some budget history entries
INSERT INTO budget_history (budget_id, user_id, action, amount_change, description)
SELECT
    b.id,
    b.user_id,
    'spent',
    45.75,
    'Grocery shopping at Whole Foods'
FROM budgets b
JOIN users u ON b.user_id = u.id
WHERE u.email = 'john.doe@example.com' AND b.category = 'Food & Dining';

-- Sample expense predictions
INSERT INTO expense_predictions (
    user_id,
    prediction_type,
    category,
    predicted_amount,
    confidence_interval,
    prediction_date,
    model_version
)
SELECT
    u.id,
    'category_spending',
    'Food & Dining',
    285.00,
    '{"lower": 245.00, "upper": 325.00}',
    (CURRENT_DATE + INTERVAL '1 month')::DATE,
    'v1.2.0'
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'monthly_total',
    NULL,
    1250.00,
    '{"lower": 1100.00, "upper": 1400.00}',
    (CURRENT_DATE + INTERVAL '1 month')::DATE,
    'v1.2.0'
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Mark some insights as read
UPDATE ai_insights
SET is_read = true, read_at = CURRENT_TIMESTAMP
WHERE insight_type = 'saving_opportunity';

-- Mark some alerts as read
UPDATE budget_alerts
SET is_read = true, read_at = CURRENT_TIMESTAMP
WHERE alert_type = 'approaching_limit';

-- Add some custom budget categories
INSERT INTO budget_categories (
    user_id,
    name,
    icon,
    color,
    description,
    is_system,
    keywords
)
SELECT
    u.id,
    'Pet Care',
    '🐕',
    '#FF6B6B',
    'Veterinary bills, pet food, and pet supplies',
    false,
    ARRAY['pet', 'vet', 'dog', 'cat', 'animal']
FROM users u WHERE u.email = 'john.doe@example.com'
UNION ALL
SELECT
    u.id,
    'Home Improvement',
    '🏠',
    '#4ECDC4',
    'Tools, materials, and home renovation projects',
    false,
    ARRAY['home', 'improvement', 'renovation', 'tools', 'hardware']
FROM users u WHERE u.email = 'jane.smith@example.com';

-- Create a successful goal completion
UPDATE financial_goals
SET current_amount = target_amount, achieved_at = CURRENT_TIMESTAMP
WHERE goal_type = 'debt_payoff';

COMMIT;