CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Couple profile
  bride_name VARCHAR(100) DEFAULT 'Bella',
  groom_name VARCHAR(100) DEFAULT 'Edward',
  wedding_date DATE,
  wedding_location VARCHAR(300),
  -- Budget
  wedding_budget DECIMAL(12, 2),
  local_currency VARCHAR(10) DEFAULT 'USD',
  vendor_currency VARCHAR(10) DEFAULT 'EUR',
  exchange_rate DECIMAL(10, 6) DEFAULT 0.9259,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed demo row
INSERT INTO wedding_settings (bride_name, groom_name, wedding_date, wedding_location, wedding_budget, local_currency, vendor_currency, exchange_rate)
VALUES ('Bella', 'Edward', '2026-09-20', 'Hacienda de los Naranjos, Seville, Spain', 50000, 'USD', 'EUR', 0.9259)
ON CONFLICT DO NOTHING;
