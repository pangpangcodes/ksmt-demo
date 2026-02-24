-- Admin Dashboard Tables
-- Run this SQL in Supabase Dashboard > SQL Editor
-- Then run: npm run populate-admin

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(100) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),
  estimated_cost_eur DECIMAL(10, 2),
  estimated_cost_cad DECIMAL(10, 2),
  contract_signed BOOLEAN DEFAULT false,
  contract_url VARCHAR(500),
  payments JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  attending BOOLEAN NOT NULL,
  number_of_guests INTEGER DEFAULT 1,
  guests JSONB DEFAULT '[]'::jsonb,
  dietary_requirements TEXT,
  song_request TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);
CREATE INDEX IF NOT EXISTS idx_rsvps_attending ON rsvps(attending);

-- Wedding Settings (migration 005)
CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bride_name VARCHAR(100) DEFAULT 'Bella',
  groom_name VARCHAR(100) DEFAULT 'Edward',
  wedding_date DATE,
  wedding_location VARCHAR(300),
  wedding_budget DECIMAL(12, 2),
  local_currency VARCHAR(10) DEFAULT 'USD',
  vendor_currency VARCHAR(10) DEFAULT 'EUR',
  exchange_rate DECIMAL(10, 6) DEFAULT 0.9259,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO wedding_settings (bride_name, groom_name, wedding_date, wedding_location, wedding_budget, local_currency, vendor_currency, exchange_rate)
VALUES ('Bella', 'Edward', '2026-09-20', 'Hacienda de los Naranjos, Seville, Spain', 50000, 'USD', 'EUR', 0.9259)
ON CONFLICT DO NOTHING;
