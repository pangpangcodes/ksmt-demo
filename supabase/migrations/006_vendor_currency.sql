-- Add vendor_currency to vendors table
-- Purpose: Store the native currency for each vendor (e.g. EUR, USD, GBP)
-- Date: 2026-02-24

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS vendor_currency VARCHAR(10);

COMMENT ON COLUMN vendors.vendor_currency IS 'Native currency for this vendor (e.g. EUR, USD, GBP, CAD). Used to display payment amounts in the correct currency.';
