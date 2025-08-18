-- Migration 003: Create Analytics and Reporting Tables
-- Description: Creates analytics cache, reports, and AI insights tables

-- Analytics cache table (for expensive queries)
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key VARCHAR(255) NOT NULL,
    cache_data JSONB NOT NULL,
    query_params JSONB,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('day', 'week', 'month', 'quarter', 'year')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    record_count INTEGER DEFAULT 0,
    computation_time_ms INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, cache_key, period_start, period_end),
    INDEX idx_analytics_cache_user_id (user_id),
    INDEX idx_analytics_cache_key (cache_key),
    INDEX idx_analytics_cache_expires (expires_at),
    INDEX idx_analytics_cache_period (period_type, period_start, period_end)
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
        'spending_pattern',
        'budget_recommendation',
        'saving_opportunity',
        'unusual_expense',
        'category_trend',
        'merchant_analysis',
        'seasonal_pattern',
        'goal_progress'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    merchant VARCHAR(100),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
    actionable BOOLEAN DEFAULT true,
    data JSONB, -- Additional insight data
    amount_related DECIMAL(12,2),
    date_range_start DATE,
    date_range_end DATE,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_ai_insights_user_id (user_id),
    INDEX idx_ai_insights_type (insight_type),
    INDEX idx_ai_insights_category (category),
    INDEX idx_ai_insights_impact (impact_level),
    INDEX idx_ai_insights_unread (user_id, is_read) WHERE is_read = false,
    INDEX idx_ai_insights_created_at (created_at)
);

-- User reports table
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'monthly_summary',
        'weekly_summary',
        'quarterly_review',
        'annual_report',
        'budget_performance',
        'spending_trends',
        'category_analysis',
        'custom_report'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_data JSONB NOT NULL,
    metadata JSONB,
    file_path VARCHAR(500), -- For PDF/Excel exports
    is_automated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_reports_user_id (user_id),
    INDEX idx_user_reports_type (report_type),
    INDEX idx_user_reports_period (period_start, period_end),
    INDEX idx_user_reports_status (status),
    INDEX idx_user_reports_generated (generated_at)
);

-- Spending patterns table (ML insights)
CREATE TABLE IF NOT EXISTS spending_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN (
        'weekly_cycle',
        'monthly_cycle',
        'seasonal_trend',
        'merchant_preference',
        'category_trend',
        'spending_spike',
        'saving_streak'
    )),
    pattern_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    merchant VARCHAR(100),
    frequency VARCHAR(20), -- daily, weekly, monthly, etc.
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    average_amount DECIMAL(12,2),
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),
    occurrence_count INTEGER DEFAULT 1,
    pattern_data JSONB, -- Detailed pattern information
    first_occurrence DATE,
    last_occurrence DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_spending_patterns_user_id (user_id),
    INDEX idx_spending_patterns_type (pattern_type),
    INDEX idx_spending_patterns_category (category),
    INDEX idx_spending_patterns_active (is_active),
    INDEX idx_spending_patterns_confidence (confidence_score)
);

-- Financial goals table
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'savings_target',
        'spending_limit',
        'category_budget',
        'debt_payoff',
        'emergency_fund',
        'investment_target'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12,2) DEFAULT 0,
    category VARCHAR(100),
    target_date DATE,
    auto_contribution DECIMAL(12,2) DEFAULT 0,
    contribution_frequency VARCHAR(20) DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT true,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_financial_goals_user_id (user_id),
    INDEX idx_financial_goals_type (goal_type),
    INDEX idx_financial_goals_active (is_active),
    INDEX idx_financial_goals_target_date (target_date)
);

-- Goal progress tracking
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    progress_type VARCHAR(20) DEFAULT 'contribution' CHECK (progress_type IN ('contribution', 'withdrawal', 'adjustment')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_goal_progress_goal_id (goal_id),
    INDEX idx_goal_progress_created_at (created_at)
);

-- Expense predictions table (ML predictions)
CREATE TABLE IF NOT EXISTS expense_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN (
        'monthly_total',
        'category_spending',
        'merchant_spending',
        'budget_forecast',
        'seasonal_adjustment'
    )),
    category VARCHAR(100),
    merchant VARCHAR(100),
    predicted_amount DECIMAL(12,2) NOT NULL,
    confidence_interval JSONB, -- Lower and upper bounds
    prediction_date DATE NOT NULL,
    actual_amount DECIMAL(12,2),
    accuracy_score DECIMAL(3,2),
    model_version VARCHAR(50),
    features_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_expense_predictions_user_id (user_id),
    INDEX idx_expense_predictions_type (prediction_type),
    INDEX idx_expense_predictions_date (prediction_date),
    INDEX idx_expense_predictions_category (category)
);

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_spending_patterns_updated_at ON spending_patterns;
CREATE TRIGGER update_spending_patterns_updated_at
    BEFORE UPDATE ON spending_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to generate monthly insights
CREATE OR REPLACE FUNCTION generate_monthly_insights(user_uuid UUID, target_month DATE)
RETURNS TABLE(
    insight_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    confidence_score DECIMAL(3,2)
) AS $$
DECLARE
    month_start DATE;
    month_end DATE;
    prev_month_start DATE;
    prev_month_end DATE;
BEGIN
    -- Calculate date ranges
    month_start := DATE_TRUNC('month', target_month)::DATE;
    month_end := (month_start + INTERVAL '1 month - 1 day')::DATE;
    prev_month_start := (month_start - INTERVAL '1 month')::DATE;
    prev_month_end := (month_start - INTERVAL '1 day')::DATE;

    -- Example insight: spending comparison with previous month
    -- This would be enhanced with actual expense data from MongoDB
    RETURN QUERY
    SELECT
        'spending_pattern'::VARCHAR(50),
        'Monthly Spending Analysis'::VARCHAR(255),
        'Analysis of spending patterns for ' || TO_CHAR(target_month, 'Month YYYY'),
        0.85::DECIMAL(3,2);
END;
$$ language 'plpgsql';

-- Function to calculate financial health score
CREATE OR REPLACE FUNCTION calculate_financial_health_score(user_uuid UUID)
RETURNS TABLE(
    overall_score INTEGER,
    budget_score INTEGER,
    savings_score INTEGER,
    spending_consistency INTEGER,
    goal_progress INTEGER
) AS $$
DECLARE
    budget_performance DECIMAL;
    savings_rate DECIMAL;
    consistency_score DECIMAL;
    goals_achieved DECIMAL;
    final_score INTEGER;
BEGIN
    -- This would integrate with actual expense and budget data
    -- For now, returning sample scores
    budget_performance := 75;
    savings_rate := 20;
    consistency_score := 80;
    goals_achieved := 60;

    final_score := (budget_performance * 0.3 + savings_rate * 0.3 + consistency_score * 0.2 + goals_achieved * 0.2)::INTEGER;

    RETURN QUERY
    SELECT
        final_score,
        budget_performance::INTEGER,
        savings_rate::INTEGER,
        consistency_score::INTEGER,
        goals_achieved::INTEGER;
END;
$$ language 'plpgsql';

-- View for user analytics dashboard
CREATE OR REPLACE VIEW user_analytics_dashboard AS
SELECT
    u.id as user_id,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT b.id) as total_budgets,
    COUNT(DISTINCT CASE WHEN b.is_active THEN b.id END) as active_budgets,
    COALESCE(SUM(CASE WHEN b.is_active THEN b.amount END), 0) as total_budget_amount,
    COALESCE(SUM(CASE WHEN b.is_active THEN b.spent END), 0) as total_spent,
    COUNT(DISTINCT fg.id) as total_goals,
    COUNT(DISTINCT CASE WHEN fg.is_active THEN fg.id END) as active_goals,
    COUNT(DISTINCT ai.id) as unread_insights
FROM users u
LEFT JOIN budgets b ON u.id = b.user_id
LEFT JOIN financial_goals fg ON u.id = fg.user_id
LEFT JOIN ai_insights ai ON u.id = ai.user_id AND ai.is_read = false
WHERE u.is_active = true
GROUP BY u.id, u.first_name, u.last_name;