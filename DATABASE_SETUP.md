# Database Setup Guide

Complete guide for setting up the Bridezilla Demo database schema in Supabase.

---

## Overview

The Bridezilla application uses PostgreSQL via Supabase with the following table groups:

1. **Planner Workspace** - Professional planner's couple and vendor management
2. **Admin/Couple Workspace** - Couple's own vendor and RSVP management
3. **Shared Workspace** - Couples viewing planner recommendations

---

## Quick Setup

### Prerequisites
- Supabase account and project
- Supabase URL and keys in `.env.local`
- Supabase CLI installed (optional but recommended)

### Option 1: Using Supabase CLI (Recommended)

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Option 2: Manual Setup

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Go to SQL Editor

2. **Run Migration Files**
   - Navigate to `supabase/migrations/` directory
   - Copy each migration file content
   - Paste and run in SQL Editor (in order by timestamp)

3. **Verify Tables**
   - Go to Table Editor
   - Confirm all tables are created

---

## Complete Schema

### 1. Planner Workspace Tables

#### `planner_couples`
Couples managed by professional planners.

**Columns:**
- `id` (uuid, primary key) - Unique couple identifier
- `couple_names` (text, required) - E.g., "Sarah & John"
- `couple_email` (text) - Contact email
- `wedding_date` (date) - Celebration date
- `wedding_location` (text) - City, country, or venue address
- `venue_name` (text) - Venue/location name
- `share_link_id` (text, unique) - URL-safe ID for shared portal
- `notes` (text) - Private planner notes
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamp) - Record creation
- `updated_at` (timestamp) - Last modification

**Indexes:**
- `share_link_id` (unique)
- `wedding_date`
- `couple_email`

**Usage:** Central record for each couple the planner manages. Share link enables couple portal access.

---

#### `planner_vendor_library`
Planner's curated vendor collection.

**Columns:**
- `id` (uuid, primary key) - Vendor identifier
- `vendor_type` (text, required) - Category (DJ, Photographer, Florist, etc.)
- `vendor_name` (text, required) - Business name
- `contact_name` (text) - Primary contact person
- `email` (text) - Contact email
- `phone` (text) - Contact phone
- `website` (text) - Website URL
- `instagram` (text) - Instagram handle
- `location` (text) - Service region/city
- `tags` (text[]) - Array of tags (luxury, boho, beach, etc.)
- `portfolio_images` (text[]) - Array of image URLs
- `pricing` (text) - Pricing information/notes
- `description` (text) - Services description
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamp) - Record creation
- `updated_at` (timestamp) - Last modification

**Indexes:**
- `vendor_type`
- `tags` (GIN index for array search)
- `is_active`

**Usage:** Planner's personal vendor library. Can be shared with multiple couples.

---

#### `shared_vendors`
Vendors shared with specific couples.

**Columns:**
- `id` (uuid, primary key) - Shared record identifier
- `planner_couple_id` (uuid, required, foreign key) - References `planner_couples.id`
- `vendor_library_id` (uuid, foreign key) - References `planner_vendor_library.id`
- `vendor_name` (text, required) - Vendor name (denormalized)
- `vendor_type` (text, required) - Vendor type (denormalized)
- `estimated_cost_eur` (numeric) - Estimated cost in EUR
- `estimated_cost_cad` (numeric) - Estimated cost in CAD/USD
- `couple_status` (text) - Couple's response: 'interested', 'pass', null (in review)
- `couple_note` (text) - Couple's private notes
- `planner_note` (text) - Planner's notes about this recommendation
- `shared_at` (timestamp, default: now()) - When vendor was shared
- `created_at` (timestamp) - Record creation
- `updated_at` (timestamp) - Last modification

**Foreign Keys:**
- `planner_couple_id` → `planner_couples.id` (CASCADE on delete)
- `vendor_library_id` → `planner_vendor_library.id` (SET NULL on delete)

**Indexes:**
- `planner_couple_id`
- `vendor_library_id`
- `couple_status`

**Usage:** Bridge table between couples and vendors. Tracks couple's feedback on recommendations.

---

#### `vendor_activity`
Audit trail for all vendor actions.

**Columns:**
- `id` (uuid, primary key) - Activity record identifier
- `planner_couple_id` (uuid, foreign key) - References `planner_couples.id`
- `shared_vendor_id` (uuid, foreign key) - References `shared_vendors.id`
- `action` (text, required) - Action type (vendor_shared, status_changed, note_added, invitation_sent, etc.)
- `actor` (text, required) - Who performed action: 'planner' or 'couple'
- `old_value` (text) - Previous value (for changes)
- `new_value` (text) - New value (for changes)
- `metadata` (jsonb) - Additional context
- `created_at` (timestamp, default: now()) - When action occurred

**Foreign Keys:**
- `planner_couple_id` → `planner_couples.id` (CASCADE on delete)
- `shared_vendor_id` → `shared_vendors.id` (CASCADE on delete)

**Indexes:**
- `planner_couple_id`
- `shared_vendor_id`
- `created_at`
- `action`

**Usage:** Complete history of vendor interactions for analytics and debugging.

---

### 2. Admin/Couple Workspace Tables

#### `vendors`
Vendors for the demo couple's own wedding.

**Columns:**
- `id` (uuid, primary key) - Vendor identifier
- `vendor_type` (text, required) - Category (DJ, Photographer, Venue, etc.)
- `contact_name` (text, required) - Primary contact
- `email` (text) - Contact email
- `phone` (text) - Contact phone
- `website` (text) - Website URL
- `vendor_currency` (text, default: 'EUR') - Original currency
- `vendor_cost` (numeric) - Cost in original currency
- `cost_converted_currency` (text, default: 'USD') - Converted currency
- `cost_converted` (numeric) - Converted cost
- `contract_required` (boolean, default: true) - Is contract needed?
- `contract_signed` (boolean, default: false) - Contract status
- `contract_signed_date` (date) - When contract was signed
- `payments` (jsonb, default: '[]') - Array of payment objects
- `notes` (text) - Internal notes
- `created_at` (timestamp) - Record creation
- `updated_at` (timestamp) - Last modification

**Payment Object Structure (JSONB):**
```json
{
  "description": "Deposit 50%",
  "amount": 500,
  "currency": "EUR",
  "due_date": "2026-03-15",
  "is_paid": false,
  "paid_date": null,
  "payment_method": "bank_transfer",
  "is_refundable": false
}
```

**Indexes:**
- `vendor_type`
- `contract_signed`

**Usage:** Couple's own vendor tracking with payment schedules.

---

#### `rsvps`
Guest RSVP responses for the demo wedding.

**Columns:**
- `id` (uuid, primary key) - RSVP identifier
- `name` (text, required) - Guest name
- `email` (text) - Contact email
- `phone` (text) - Contact phone
- `attending` (boolean, required) - Attendance confirmation
- `number_of_guests` (integer, default: 1) - Total guests (including plus-ones)
- `dietary_restrictions` (text) - Special meal requirements
- `message` (text) - Personal message/notes
- `submission_ip` (text) - IP address of submission
- `created_at` (timestamp, default: now()) - Submission time

**Indexes:**
- `email`
- `attending`
- `created_at`

**Usage:** Guest responses from the demo wedding RSVP form.

---

#### `rsvp_guests`
Plus-one guests for RSVPs.

**Columns:**
- `id` (uuid, primary key) - Guest identifier
- `rsvp_id` (uuid, required, foreign key) - References `rsvps.id`
- `guest_name` (text, required) - Plus-one name
- `guest_order` (integer, default: 1) - Order in plus-one list
- `created_at` (timestamp) - Record creation

**Foreign Keys:**
- `rsvp_id` → `rsvps.id` (CASCADE on delete)

**Indexes:**
- `rsvp_id`
- `guest_order`

**Usage:** Track additional guests (plus-ones, plus-twos, etc.) separately from primary RSVP.

---

## Data Relationships

```
planner_couples (1) ←→ (many) shared_vendors
                        ↓
planner_vendor_library (1) ←→ (many) shared_vendors

planner_couples (1) ←→ (many) vendor_activity
shared_vendors (1) ←→ (many) vendor_activity

rsvps (1) ←→ (many) rsvp_guests
```

---

## Sample Data Population

### Planner Workspace Sample Data

**To populate planner workspace with test data:**

```sql
-- Insert sample planner couple
INSERT INTO planner_couples (couple_names, couple_email, wedding_date, wedding_location, venue_name, share_link_id)
VALUES
  ('Sarah & John', 'sarah.john@example.com', '2026-09-15', 'Tuscany, Italy', 'Villa Vignamaggio', 'sarah-john-2026'),
  ('Emma & Michael', 'emma.michael@example.com', '2026-07-20', 'Santorini, Greece', 'Rocabella Resort', 'emma-michael-2026');

-- Insert sample vendors to library
INSERT INTO planner_vendor_library (vendor_type, vendor_name, contact_name, email, location, tags, pricing)
VALUES
  ('Photographer', 'Bella Vista Photography', 'Marco Rossi', 'marco@bellavista.com', 'Tuscany, Italy', ARRAY['luxury', 'editorial', 'destination'], '€3,500 - €5,000'),
  ('Florist', 'Fiori di Campo', 'Giulia Bianchi', 'giulia@fioridi.com', 'Florence, Italy', ARRAY['romantic', 'garden', 'seasonal'], '€2,000 - €4,000'),
  ('DJ', 'Soundwave Entertainment', 'Alex Turner', 'alex@soundwave.co.uk', 'London, UK', ARRAY['modern', 'international'], '£1,200 - £2,500');
```

### Admin Workspace Sample Data

**The admin workspace uses demo data from `lib/mock-data.ts`:**
- ~10 pre-defined vendors (DJ, Photographer, Venue, etc.)
- 4 sample RSVP responses
- Already included in the application code

**To populate from scratch:**

```bash
npm run db:populate
```

This script:
1. Clears existing `vendors` and `rsvps` data
2. Inserts vendors from `MOCK_VENDORS` array
3. Inserts sample RSVP responses

---

## Environment Variables for Database

Ensure these are set in `.env.local`:

```env
# Supabase Database Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Migrations Management

### Creating New Migrations

```bash
# Using Supabase CLI
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Add your SQL statements

# Apply migration
supabase db push
```

### Rolling Back Migrations

```bash
# Reset to specific migration
supabase db reset --version <timestamp>

# Reset completely (caution!)
supabase db reset
```

---

## Common Queries

### Get All Vendors Shared with a Couple

```sql
SELECT
  sv.*,
  vl.contact_name,
  vl.email,
  vl.phone,
  vl.website,
  vl.portfolio_images,
  vl.description
FROM shared_vendors sv
LEFT JOIN planner_vendor_library vl ON sv.vendor_library_id = vl.id
WHERE sv.planner_couple_id = 'couple-uuid'
ORDER BY sv.vendor_type, sv.vendor_name;
```

### Get Couple's Vendor Activity Timeline

```sql
SELECT
  va.*,
  sv.vendor_name,
  sv.vendor_type
FROM vendor_activity va
LEFT JOIN shared_vendors sv ON va.shared_vendor_id = sv.id
WHERE va.planner_couple_id = 'couple-uuid'
ORDER BY va.created_at DESC;
```

### Get RSVP Summary

```sql
SELECT
  COUNT(*) FILTER (WHERE attending = true) as attending,
  COUNT(*) FILTER (WHERE attending = false) as not_attending,
  SUM(number_of_guests) FILTER (WHERE attending = true) as total_guests,
  COUNT(*) as total_responses
FROM rsvps;
```

### Get Vendor Payment Summary

```sql
SELECT
  vendor_type,
  COUNT(*) as vendor_count,
  SUM(vendor_cost) as total_cost,
  SUM(
    (SELECT SUM((payment->>'amount')::numeric)
     FROM jsonb_array_elements(payments) as payment
     WHERE (payment->>'is_paid')::boolean = true)
  ) as total_paid
FROM vendors
GROUP BY vendor_type
ORDER BY total_cost DESC;
```

---

## Troubleshooting

### "relation does not exist" error
- Tables haven't been created yet
- Run migrations: `supabase db push`
- Or manually run SQL from `supabase/migrations/`

### Foreign key constraint violation
- Referenced record doesn't exist
- Check that couple/vendor exists before creating shared_vendor
- Use CASCADE delete to auto-remove dependent records

### Cannot insert NULL value
- Required field is missing
- Check table schema for NOT NULL constraints
- Provide all required fields in INSERT statement

### Migration conflicts
- Multiple migrations modifying same table
- Reset database: `supabase db reset` (caution: deletes data!)
- Or manually resolve conflicts in migration files

### Data not appearing in app
- Check Supabase connection in `.env.local`
- Verify correct table name (case-sensitive)
- Check Row Level Security (RLS) policies if enabled
- Query database directly in Supabase dashboard to confirm data exists

---

## Security Considerations

### Row Level Security (RLS)

For production deployments, enable RLS policies:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE planner_couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner_vendor_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_vendors ENABLE ROW LEVEL SECURITY;

-- Example policy: Only authenticated users can read
CREATE POLICY "Allow read for authenticated users"
  ON planner_couples
  FOR SELECT
  TO authenticated
  USING (true);

-- Example policy: Share links are public
CREATE POLICY "Allow read via share link"
  ON shared_vendors
  FOR SELECT
  TO anon
  USING (
    planner_couple_id IN (
      SELECT id FROM planner_couples
      WHERE share_link_id = current_setting('request.headers')::json->>'x-share-link'
    )
  );
```

### API Key Security

- Never commit API keys to version control
- Use service role key only on server-side
- Rotate keys periodically
- Use anon key for client-side operations

---

## Backup & Recovery

### Export Data

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or use pg_dump with connection string
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" > backup.sql
```

### Import Data

```bash
# Using Supabase CLI
supabase db push -f backup.sql

# Or use psql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" < backup.sql
```

---

## Performance Optimization

### Recommended Indexes

Already created in migrations, but for reference:

```sql
-- Planner workspace indexes
CREATE INDEX idx_planner_couples_share_link ON planner_couples(share_link_id);
CREATE INDEX idx_planner_couples_wedding_date ON planner_couples(wedding_date);
CREATE INDEX idx_vendor_library_type ON planner_vendor_library(vendor_type);
CREATE INDEX idx_vendor_library_tags ON planner_vendor_library USING GIN(tags);
CREATE INDEX idx_shared_vendors_couple ON shared_vendors(planner_couple_id);
CREATE INDEX idx_shared_vendors_status ON shared_vendors(couple_status);
CREATE INDEX idx_vendor_activity_couple ON vendor_activity(planner_couple_id);
CREATE INDEX idx_vendor_activity_created ON vendor_activity(created_at DESC);

-- Admin workspace indexes
CREATE INDEX idx_vendors_type ON vendors(vendor_type);
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_rsvps_created ON rsvps(created_at DESC);
CREATE INDEX idx_rsvp_guests_rsvp_id ON rsvp_guests(rsvp_id);
```

### Query Optimization Tips

1. Use indexes for frequently filtered columns
2. Avoid `SELECT *` - specify needed columns
3. Use JOINs instead of multiple queries
4. Add LIMIT clauses for pagination
5. Use database views for complex repeated queries

---

## Schema Version History

- **v1.0** (Initial) - Admin tables (vendors, rsvps)
- **v2.0** - Planner workspace (couples, vendor_library, shared_vendors)
- **v3.0** - Activity tracking (vendor_activity)
- **v3.1** - RSVP guests (rsvp_guests for plus-ones)
- **v3.2** - Payment JSONB structure in vendors table

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **SQL Tutorial**: https://www.postgresqltutorial.com/

For application-specific database usage, see:
- `lib/supabase-client.ts` - Browser client
- `lib/supabase.ts` - Server client
- `types/*.ts` - TypeScript interfaces

---

**Need help?** Create an issue or check existing migrations in `supabase/migrations/`
