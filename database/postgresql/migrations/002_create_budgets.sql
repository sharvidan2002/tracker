-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    spent DECIMAL(12, 2) DEFAULT 0 CHECK (spent >= 0),
    category VARCHAR(100) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT budgets_date_range CHECK (end_date > start_date),
    CONSTRAINT budgets_unique_active_budget UNIQUE (user_id, category, period, start_date, end_date)
        DEFERRABLE INITIALLY DEFERRED
);

-- Budget alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'approaching_limit',
        'exceeded_budget',
        'milestone_reached',
        'period_ending',
        'unusual_spending',
        'budget_exceeded',
        'weekly_summary',
        'monthly_summary'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    threshold_percentage INTEGER,
    current_amount DECIMAL(12, 2),
    budget_amount DECIMAL(12, 2),
    data JSONB, -- Additional alert data
    is_read BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget history table for tracking changes
CREATE TABLE IF NOT EXISTS budget_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'spent', 'reset')),
    old_values JSONB,
    new_values JSONB,
    amount_change DECIMAL(12, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget sharing table (for family/group budgets)
CREATE TABLE IF NOT EXISTS budget_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
    invited_by UUID NOT NULL REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT budget_shares_unique UNIQUE (budget_id, shared_with_user_id)
);

-- Budget goals table (for savings and target goals)
CREATE TABLE IF NOT EXISTS budget_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(30) NOT NULL CHECK (goal_type IN ('save_amount', 'reduce_spending', 'stay_under_budget')),
    target_amount DECIMAL(12, 2),
    current_progress DECIMAL(12, 2) DEFAULT 0,
    target_date DATE,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category);
CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_unread ON budget_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_budget_alerts_active ON budget_alerts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_budget_history_budget_id ON budget_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_user_id ON budget_history(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_action ON budget_history(action);
CREATE INDEX IF NOT EXISTS idx_budget_history_created_at ON budget_history(created_at);

CREATE INDEX IF NOT EXISTS idx_budget_shares_budget_id ON budget_shares(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_shares_user_id ON budget_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_budget_shares_active ON budget_shares(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_budget_goals_budget_id ON budget_goals(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_user_id ON budget_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_type ON budget_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_budget_goals_achieved ON budget_goals(is_achieved);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_goals_updated_at ON budget_goals;
CREATE TRIGGER update_budget_goals_updated_at
    BEFORE UPDATE ON budget_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Budget history trigger
CREATE OR REPLACE FUNCTION log_budget_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO budget_history (budget_id, user_id, action, new_values)
        VALUES (NEW.id, NEW.user_id, 'created', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO budget_history (budget_id, user_id, action, old_values, new_values, amount_change)
        VALUES (
            NEW.id,
            NEW.user_id,
            'updated',
            row_to_json(OLD),
            row_to_json(NEW),
            NEW.spent - OLD.spent
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO budget_history (budget_id, user_id, action, old_values)
        VALUES (OLD.id, OLD.user_id, 'deleted', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS budget_history_trigger ON budgets;
CREATE TRIGGER budget_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION log_budget_changes();

-- Function to get budget status
CREATE OR REPLACE FUNCTION get_budget_status(budget_id UUID)
RETURNS TABLE(
    status VARCHAR(20),
    usage_percentage DECIMAL(5,2),
    remaining_amount DECIMAL(12,2),
    days_remaining INTEGER,
    daily_budget_remaining DECIMAL(12,2)
) AS $$
DECLARE
    budget_record RECORD;
    usage_pct DECIMAL(5,2);
    remaining DECIMAL(12,2);
    days_left INTEGER;
    daily_remaining DECIMAL(12,2);
    status_result VARCHAR(20);
BEGIN
    SELECT * INTO budget_record FROM budgets WHERE id = budget_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    usage_pct := (budget_record.spent / budget_record.amount) * 100;
    remaining := budget_record.amount - budget_record.spent;
    days_left := budget_record.end_date - CURRENT_DATE;

    IF days_left > 0 THEN
        daily_remaining := remaining / days_left;
    ELSE
        daily_remaining := 0;
    END IF;

    IF usage_pct >= 100 THEN
        status_result := 'over_budget';
    ELSIF usage_pct >= budget_record.alert_threshold THEN
        status_result := 'warning';
    ELSE
        status_result := 'on_track';
    END IF;

    RETURN QUERY SELECT
        status_result,
        usage_pct,
        remaining,
        days_left,
        daily_remaining;
END;
$$ language 'plpgsql';

-- Function to update budget spent amount when expense is added/updated/deleted
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
    old_amount DECIMAL(12,2) := 0;
    new_amount DECIMAL(12,2) := 0;
BEGIN
    -- Get amounts based on operation
    IF TG_OP = 'DELETE' THEN
        old_amount := OLD.amount;
    ELSIF TG_OP = 'INSERT' THEN
        new_amount := NEW.amount;
    ELSIF TG_OP = 'UPDATE' THEN
        old_amount := OLD.amount;
        new_amount := NEW.amount;
    END IF;

    -- Update relevant budgets
    FOR budget_record IN
        SELECT b.* FROM budgets b
        WHERE b.user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND b.is_active = true
        AND b.category = COALESCE(NEW.category, OLD.category)
        AND COALESCE(NEW.date, OLD.date)::date BETWEEN b.start_date AND b.end_date
    LOOP
        UPDATE budgets
        SET spent = spent - old_amount + new_amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = budget_record.id;

        -- Check if budget alert should be triggered
        PERFORM check_budget_alerts(budget_record.id);
    END LOOP;

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function to check and create budget alerts
CREATE OR REPLACE FUNCTION check_budget_alerts(budget_id UUID)
RETURNS VOID AS $$
DECLARE
    budget_record RECORD;
    usage_pct DECIMAL(5,2);
    alert_title VARCHAR(255);
    alert_message TEXT;
    alert_type VARCHAR(50);
    severity VARCHAR(20);
BEGIN
    SELECT * INTO budget_record FROM budgets WHERE id = budget_id;

    IF NOT FOUND OR NOT budget_record.is_active THEN
        RETURN;
    END IF;

    usage_pct := (budget_record.spent / budget_record.amount) * 100;

    -- Check for over budget
    IF usage_pct > 100 THEN
        alert_type := 'exceeded_budget';
        severity := 'critical';
        alert_title := 'Budget Exceeded';
        alert_message := format('You have exceeded your %s budget for %s by %s',
            budget_record.period, budget_record.category,
            (budget_record.spent - budget_record.amount)::money);

    -- Check for approaching limit
    ELSIF usage_pct >= budget_record.alert_threshold THEN
        alert_type := 'approaching_limit';
        severity := 'high';
        alert_title := 'Approaching Budget Limit';
        alert_message := format('You have used %s%% of your %s budget for %s',
            round(usage_pct, 1), budget_record.period, budget_record.category);

    -- Check for milestone reached (every 25%)
    ELSIF usage_pct >= 75 THEN
        alert_type := 'milestone_reached';
        severity := 'medium';
        alert_title := '75% Budget Used';
        alert_message := format('You have used 75%% of your %s budget for %s',
            budget_record.period, budget_record.category);

    ELSIF usage_pct >= 50 THEN
        alert_type := 'milestone_reached';
        severity := 'low';
        alert_title := '50% Budget Used';
        alert_message := format('You have used 50%% of your %s budget for %s',
            budget_record.period, budget_record.category);

    ELSE
        RETURN; -- No alert needed
    END IF;

    -- Check if similar alert already exists to avoid spam
    IF NOT EXISTS (
        SELECT 1 FROM budget_alerts
        WHERE budget_id = budget_record.id
        AND alert_type = alert_type
        AND triggered_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        AND is_active = true
    ) THEN
        -- Create the alert
        INSERT INTO budget_alerts (
            budget_id, user_id, alert_type, title, message, severity,
            threshold_percentage, current_amount, budget_amount,
            data
        ) VALUES (
            budget_record.id, budget_record.user_id, alert_type, alert_title, alert_message, severity,
            round(usage_pct), budget_record.spent, budget_record.amount,
            jsonb_build_object(
                'category', budget_record.category,
                'period', budget_record.period,
                'usage_percentage', usage_pct,
                'remaining_amount', budget_record.amount - budget_record.spent
            )
        );
    END IF;
END;
$$ language 'plpgsql';

-- Function to get budget summary for a user
CREATE OR REPLACE FUNCTION get_user_budget_summary(user_id UUID, period_filter VARCHAR DEFAULT NULL)
RETURNS TABLE(
    total_budgets INTEGER,
    active_budgets INTEGER,
    total_budgeted DECIMAL(12,2),
    total_spent DECIMAL(12,2),
    over_budget_count INTEGER,
    warning_count INTEGER,
    on_track_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_budgets,
        COUNT(*) FILTER (WHERE b.is_active = true)::INTEGER as active_budgets,
        COALESCE(SUM(b.amount), 0) as total_budgeted,
        COALESCE(SUM(b.spent), 0) as total_spent,
        COUNT(*) FILTER (WHERE b.is_active = true AND (b.spent / b.amount) > 1)::INTEGER as over_budget_count,
        COUNT(*) FILTER (WHERE b.is_active = true AND (b.spent / b.amount) >= (b.alert_threshold / 100.0) AND (b.spent / b.amount) <= 1)::INTEGER as warning_count,
        COUNT(*) FILTER (WHERE b.is_active = true AND (b.spent / b.amount) < (b.alert_threshold / 100.0))::INTEGER as on_track_count
    FROM budgets b
    WHERE b.user_id = user_id
    AND (period_filter IS NULL OR b.period = period_filter)
    AND CURRENT_DATE BETWEEN b.start_date AND b.end_date;
END;
$$ language 'plpgsql';

-- Function to clean up old budget alerts
CREATE OR REPLACE FUNCTION cleanup_old_budget_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM budget_alerts
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND is_read = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create trigger on expenses table to update budget spent amounts
-- Note: This assumes the expenses table exists with columns: user_id, amount, category, date
DROP TRIGGER IF EXISTS update_budget_on_expense_change ON expenses;
CREATE TRIGGER update_budget_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent();

-- Grant permissions (adjust schema and users as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO expense_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_alerts TO expense_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_history TO expense_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_shares TO expense_tracker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_goals TO expense_tracker_app;

GRANT EXECUTE ON FUNCTION get_budget_status(UUID) TO expense_tracker_app;
GRANT EXECUTE ON FUNCTION get_user_budget_summary(UUID, VARCHAR) TO expense_tracker_app;
GRANT EXECUTE ON FUNCTION cleanup_old_budget_alerts() TO expense_tracker_app;