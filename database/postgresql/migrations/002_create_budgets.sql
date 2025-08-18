-- Migration 002: Create Budgets and Related Tables
-- Description: Creates budgets, budget categories, and budget tracking tables

-- Enable btree_gist extension for advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Budget categories table (predefined and custom categories)
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system categories
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    description TEXT,
    parent_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    keywords TEXT[], -- For auto-categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, name), -- Allow same name for different users, but not same user
    CONSTRAINT budget_categories_color_check CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    spent DECIMAL(12, 2) DEFAULT 0 CHECK (spent >= 0),
    period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
    alerts_enabled BOOLEAN DEFAULT true,
    rollover BOOLEAN DEFAULT false, -- Rollover unused budget to next period
    auto_adjust BOOLEAN DEFAULT false, -- Auto-adjust based on spending patterns
    description TEXT,
    tags TEXT[],
    metadata JSONB, -- Additional budget settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT budgets_valid_date_range CHECK (end_date > start_date),
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
    shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (budget_id, shared_with_user_id)
);

-- Indexes for performance
CREATE INDEX idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX idx_budget_categories_parent_id ON budget_categories(parent_id);
CREATE INDEX idx_budget_categories_system ON budget_categories(is_system);
CREATE INDEX idx_budget_categories_active ON budget_categories(is_active);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_date_range ON budgets USING gist (user_id, daterange(start_date, end_date, '[]'));
CREATE INDEX idx_budgets_start_date ON budgets(start_date);
CREATE INDEX idx_budgets_end_date ON budgets(end_date);

CREATE INDEX idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX idx_budget_alerts_unread ON budget_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_budget_alerts_active ON budget_alerts(is_active);
CREATE INDEX idx_budget_alerts_type ON budget_alerts(alert_type);

CREATE INDEX idx_budget_history_budget_id ON budget_history(budget_id);
CREATE INDEX idx_budget_history_user_id ON budget_history(user_id);
CREATE INDEX idx_budget_history_action ON budget_history(action);
CREATE INDEX idx_budget_history_created_at ON budget_history(created_at);

CREATE INDEX idx_budget_shares_budget_id ON budget_shares(budget_id);
CREATE INDEX idx_budget_shares_shared_with ON budget_shares(shared_with_user_id);

-- Updated timestamp triggers
DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
    BEFORE UPDATE ON budget_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
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
    ELSIF usage_pct >= 50 THEN
        status_result := 'on_track';
    ELSE
        status_result := 'excellent';
    END IF;

    RETURN QUERY SELECT
        status_result,
        usage_pct,
        remaining,
        days_left,
        daily_remaining;
END;
$$ language 'plpgsql';

-- Insert default system budget categories
INSERT INTO budget_categories (name, icon, color, is_system, description, keywords) VALUES
    ('Food & Dining', '🍽️', '#E53E3E', true, 'Restaurant meals, groceries, and food delivery', ARRAY['food', 'restaurant', 'grocery', 'dining', 'lunch', 'dinner', 'breakfast']),
    ('Transportation', '🚗', '#3182CE', true, 'Gas, public transport, rideshare, and vehicle expenses', ARRAY['gas', 'uber', 'lyft', 'bus', 'train', 'car', 'fuel']),
    ('Shopping', '🛍️', '#805AD5', true, 'Clothing, electronics, and general purchases', ARRAY['shopping', 'clothes', 'amazon', 'store', 'retail']),
    ('Entertainment', '🎬', '#38A169', true, 'Movies, games, subscriptions, and leisure activities', ARRAY['movie', 'netflix', 'spotify', 'games', 'entertainment']),
    ('Bills & Utilities', '💡', '#D69E2E', true, 'Rent, electricity, internet, and recurring bills', ARRAY['rent', 'electric', 'internet', 'phone', 'utility', 'bill']),
    ('Healthcare', '🏥', '#E53E3E', true, 'Medical expenses, pharmacy, and health insurance', ARRAY['doctor', 'hospital', 'pharmacy', 'medical', 'health']),
    ('Travel', '✈️', '#3182CE', true, 'Flights, hotels, and vacation expenses', ARRAY['flight', 'hotel', 'travel', 'vacation', 'trip']),
    ('Education', '📚', '#805AD5', true, 'Tuition, books, and learning materials', ARRAY['school', 'education', 'book', 'course', 'tuition']),
    ('Personal Care', '💄', '#38A169', true, 'Salon, spa, and personal grooming', ARRAY['salon', 'spa', 'beauty', 'haircut', 'personal']),
    ('Gifts & Donations', '🎁', '#D69E2E', true, 'Presents and charitable donations', ARRAY['gift', 'present', 'donation', 'charity']),
    ('Business', '💼', '#2D3748', true, 'Business expenses and professional services', ARRAY['business', 'office', 'professional', 'work']),
    ('Other', '📝', '#718096', true, 'Miscellaneous expenses', ARRAY['other', 'misc', 'miscellaneous'])
ON CONFLICT (user_id, name) DO NOTHING;