# Supabase Database Setup

This directory contains SQL migrations for the Bridezilla planner-couple collaboration feature.

## Prerequisites

1. **Supabase Project**: You need a Supabase project. If you don't have one:
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Environment Variables**: Create `.env.local` in the demo package root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for MVP)

1. Log in to your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `migrations/001_planner_tables.sql`
4. Click **Run** to execute the migration
5. Verify tables were created in **Database > Tables**

### Option 2: Supabase CLI (For Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
```

## Tables Created

### `planner_couples`
Stores planner-couple relationships and shared workspace links.
- Couples can access their workspace via `/shared/[share_link_id]`
- No login required for couples (access via unique link)

### `shared_vendors`
Vendors shared by planners with couples (separate from admin's personal vendors).
- Linked to `planner_couples` via `planner_couple_id`
- Includes planner notes, couple status, and couple notes

### `vendor_activity`
Activity log for tracking engagement.
- Logs: vendor shared, status changed, note added
- Tracks actor: planner or couple
- Used for activity feed in planner dashboard

## Row Level Security (RLS)

For MVP, we're using simple password-based access control:
- Planners: Password gate (like `/admin`)
- Couples: Access via unique share link (no auth)

**Post-MVP**: Implement proper RLS policies when we add planner accounts.

## Testing

After running migrations, test with:

```sql
-- Insert test couple
INSERT INTO planner_couples (couple_names, couple_email, wedding_date, wedding_location, share_link_id)
VALUES ('Sarah & Mike', 'couple@example.com', '2026-09-20', 'Marbella, Spain', 'test-link-123');

-- Insert test vendor
INSERT INTO shared_vendors (planner_couple_id, vendor_name, vendor_type, contact_name, instagram, planner_note)
SELECT id, 'Test Photographer', 'Photographer', 'Juan Garcia', '@juanphoto', 'Perfect for destination weddings'
FROM planner_couples WHERE share_link_id = 'test-link-123';

-- Verify
SELECT * FROM planner_couples;
SELECT * FROM shared_vendors;
```

## Migration Rollback

If you need to rollback:

```sql
DROP TABLE IF EXISTS vendor_activity CASCADE;
DROP TABLE IF EXISTS shared_vendors CASCADE;
DROP TABLE IF EXISTS planner_couples CASCADE;
DROP FUNCTION IF EXISTS update_couple_last_activity CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
```
