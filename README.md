# Bridezilla Demo - Wedding Planning Platform

A sophisticated, multi-tenant wedding planning platform showcasing AI-powered vendor management, guest RSVP tracking, and collaborative wedding coordination tools.

**Live Demo**: [https://bridezilla-demo.vercel.app](https://bridezilla-demo.vercel.app)

---

## Overview

Bridezilla Demo is a comprehensive wedding planning solution built with Next.js, React, and Supabase. The platform serves three distinct user roles:

1. **Professional Planners** - Manage multiple couples, curate vendor libraries, and share recommendations
2. **Couples (Admin)** - Plan their own wedding with vendor management, payment tracking, and RSVP tools
3. **Couples (Shared Portal)** - Review planner recommendations and provide feedback on vendors

### Key Features

- 🤖 **AI-Powered Parsing** - Claude integration for intelligent vendor and couple data extraction from text/PDFs
- 🎨 **Dual Theme System** - "Pop" (vibrant blue & pink) and "Heirloom" (elegant cream & forest green)
- 💰 **Multi-Currency Support** - EUR/USD conversion and tracking
- 📧 **Email Integration** - Automated invitations and notifications
- 📊 **Analytics & Insights** - Payment tracking, RSVP statistics, vendor progress
- 📱 **Responsive Design** - Mobile-optimized with inline dropdowns and touch-friendly controls
- 🔒 **Role-Based Access** - Secure workspaces for planners, couples, and guests

---

## Technology Stack

### Frontend
- **Next.js 16.1.6** (App Router, React Server Components, Turbopack)
- **React 19.2.3** - UI components and state management
- **Tailwind CSS** - Utility-first styling with custom theme system
- **Lucide React** - Icon library
- **React Big Calendar** - Calendar views for couple management
- **React Hot Toast** - Notification system

### Backend
- **Supabase** (PostgreSQL) - Database, authentication, real-time subscriptions
- **Node.js** - API routes and server-side logic
- **Anthropic Claude API** (Haiku 4.5) - AI parsing and data extraction
- **Nodemailer** - Email sending
- **PDF-Parse & PDFjs** - PDF document processing

### Development
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Vercel** - Deployment and hosting

---

## Project Structure

```
packages/demo/
├── app/                        # Next.js App Router
│   ├── admin/                  # Couples admin workspace (unauthorized)
│   ├── couples/                # Couples admin workspace (password-protected)
│   ├── planners/               # Professional planner workspace
│   ├── s/[id]/                 # Shared couple portal (public with link)
│   ├── demo/                   # Public demo pages (RSVP, itinerary, etc.)
│   └── api/                    # API routes
│       ├── admin/              # Admin APIs
│       ├── planner/            # Planner APIs
│       ├── shared/             # Shared workspace APIs
│       └── rsvp/               # RSVP APIs
├── components/                 # React components
│   ├── admin/                  # Admin workspace components
│   ├── planner/                # Planner workspace components
│   ├── shared/                 # Shared portal components
│   └── demo/                   # Demo site components
├── lib/                        # Utilities and helpers
│   ├── supabase-client.ts      # Browser Supabase client
│   ├── supabase.ts             # Server Supabase client
│   ├── anthropicClient.ts      # Claude AI integration
│   ├── themes.ts               # Theme definitions
│   └── utils/                  # Helper functions
├── types/                      # TypeScript type definitions
├── contexts/                   # React contexts (Theme)
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
└── supabase/                   # Database migrations and schema
```

---

## User Roles & Features

### 1. Professional Planner Workspace (`/planners`)

**Authentication**: Password-protected (set `PLANNER_PASSWORD` env var)

#### Couples Management
- **Calendar & List Views**: Visualize weddings by date or browse in table format
- **Search & Filters**: Find couples by name, venue, or wedding date
- **Couple Details**: Track wedding information, notes, and vendor status
- **Share Links**: Generate unique links for couples to access their vendor recommendations
- **Email Invitations**: Send automated emails with share links

#### Vendor Library
- **Curated Collection**: Maintain a personal library of trusted vendors
- **AI Parsing**: Upload PDFs or paste text to auto-extract vendor information
- **Tag System**: Organize vendors with custom tags (boho, luxury, beach, etc.)
- **Bulk Operations**: Share multiple vendors with couples at once
- **Portfolio Management**: Upload images and detailed descriptions

#### Key Features
- Multi-select filtering by vendor type and tags
- Export vendor data to CSV
- Activity tracking and audit trails
- Mobile-optimized inline dropdowns

### 2. Couple Admin Workspace (`/couples` or `/admin`)

**Authentication**: Password-protected for `/couples`, demo access for `/admin`

#### Dashboard
- **Countdown**: Days until wedding with animated display
- **Payment Tracking**: Total costs, paid amounts, outstanding balance
- **RSVP Overview**: Response rate and guest count
- **Payment Reminders**: Overdue, due today, and 7-day advance warnings

#### Vendor Management
- **Comprehensive Tracking**: Contact details, contracts, costs, payments
- **Payment Schedules**: Track deposits, installments, and final payments
- **Currency Conversion**: Auto-convert EUR to USD
- **Contract Status**: Required/signed flags with signing dates
- **AI Import**: Parse vendors from text or PDF documents
- **Export**: Download vendor and payment data as CSV

#### RSVP Tracking
- **Guest Management**: View all responses with contact information
- **Attendance Breakdown**: Yes/No/Maybe statistics
- **Plus-One Tracking**: Track additional guests
- **Dietary Restrictions**: Capture special meal requirements
- **Privacy Controls**: Toggle contact information visibility
- **Export**: Download RSVP data as CSV

#### Settings
- Wedding details configuration
- Theme selection (Pop or Heirloom)
- Display preferences

### 3. Shared Couple Portal (`/s/[share-link-id]`)

**Authentication**: None required (access via unique link)

#### Vendor Recommendations
- **View Shared Vendors**: See curated recommendations from planner
- **Status Management**: Mark vendors as "Approved", "Declined", or "Review Needed"
- **Add Notes**: Leave personal feedback on each vendor
- **Filter by Category**: Browse by vendor type (Photographer, Florist, etc.)
- **Vendor Details**: Contact information, portfolio, pricing, description

#### Statistics
- Total vendor categories
- Booked & confirmed count
- Approval progress tracking

#### Upsell Tabs
- 🔒 Guest List (locked - upgrade prompt)
- 🔒 Budget Tracker (locked - upgrade prompt)

### 4. Demo Wedding Site (`/demo`)

**Public pages showcasing couple's wedding:**
- **Homepage**: Introduction and hero section
- **Itinerary**: Wedding schedule and timeline
- **Accommodation**: Hotel recommendations and booking
- **Travel**: Transportation and logistics
- **RSVP**: Guest response form with plus-ones and dietary restrictions
- **RSVP Lookup**: Search for submitted responses
- **FAQ**: Frequently asked questions

---

## AI Features (Claude Integration)

### Vendor Parsing
- **Input**: Text descriptions or PDF documents
- **Output**: Structured vendor data with confidence scores
- **Capabilities**:
  - Extract vendor type, name, contact info
  - Parse pricing and costs
  - Identify location/region
  - Auto-suggest tags
  - Generate clarification questions for ambiguous fields
  - Batch processing for multiple vendors

### Couple Parsing
- **Input**: Text with couple information
- **Output**: Structured couple data
- **Capabilities**:
  - Extract couple names
  - Parse wedding date and location
  - Identify venue information
  - Confidence scoring

### Smart Workflows
- Preview parsed data before saving
- Answer clarification questions
- Confidence thresholds for auto-completion
- Support for multiple operations in one parse

---

## Database Schema

### Core Tables

**`planner_couples`**: Couples managed by planners
- Fields: couple_names, email, wedding_date, location, venue_name, share_link_id, notes, is_active

**`planner_vendor_library`**: Planner's curated vendor collection
- Fields: vendor_type, vendor_name, contact details, tags, portfolio_images, pricing, description

**`shared_vendors`**: Vendors shared with couples
- Fields: planner_couple_id, vendor_library_id, cost estimates (EUR/USD), status, notes
- Relations: Links to vendor_library for enrichment

**`vendor_activity`**: Audit trail
- Actions: vendor_shared, status_changed, note_added, invitation_sent
- Tracks actor (planner/couple) and changes

**`vendors`**: Admin/couple's own vendors
- Fields: vendor_type, contact details, currency, costs, contract tracking, payment schedules

**`rsvps`**: Guest responses
- Fields: name, email, phone, attending, number_of_guests, dietary_restrictions, message

**`rsvp_guests`**: Plus-one guests
- Fields: rsvp_id, guest_name, guest_order

---

## Theme System

### Pop Theme
- **Colors**: Bridezilla Blue background, Hot Pink/Orange accents
- **Style**: Modern, vibrant, playful
- **Use Case**: Contemporary couples

### Heirloom Theme
- **Colors**: Cream background, Forest Green/Rose accents
- **Style**: Classic, elegant, timeless
- **Use Case**: Traditional weddings

### Implementation
- Centralized `themes.ts` configuration
- `useThemeStyles()` hook for component access
- `ThemeContext` for global state
- Per-page theme preferences in localStorage
- Dynamic theme switching without reload

---

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm, yarn, or pnpm
- Supabase account (for database)
- Anthropic API key (for AI features)
- SMTP credentials (for emails)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bridezilla/packages/demo
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic AI
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Authentication
PLANNER_PASSWORD=your-planner-password
ADMIN_PASSWORD=your-admin-password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**

Run migrations from the `supabase/migrations` directory:
```bash
# Using Supabase CLI
supabase db push

# Or manually run SQL migrations in Supabase dashboard
```

See `DATABASE_SETUP.md` for detailed schema and setup instructions.

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Access Different Workspaces

- **Planner Workspace**: http://localhost:3000/planners
  - Password: (value of `PLANNER_PASSWORD`)

- **Couple Admin**: http://localhost:3000/couples
  - Password: (value of `ADMIN_PASSWORD`)

- **Demo Admin** (no auth): http://localhost:3000/admin

- **Shared Portal**: http://localhost:3000/s/[share-link-id]
  - Get share link from planner workspace after creating a couple

- **Demo Site**: http://localhost:3000/demo

---

## Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run dev:next         # Start Next.js dev server only

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Database
npm run db:migrate       # Run Supabase migrations
npm run db:reset         # Reset database (caution!)
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | `eyJhbGc...` |
| `ANTHROPIC_API_KEY` | Claude API key for AI parsing | `sk-ant-...` |
| `PLANNER_PASSWORD` | Password for planner workspace | `secure123` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Password for couples workspace | (none - demo mode) |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email sender address | (none) |
| `EMAIL_PASSWORD` | Email password/app password | (none) |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

---

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Connect to GitHub/GitLab repository

2. **Configure Environment Variables**
   - Add all required env vars in Vercel project settings
   - Use production values for Supabase and Anthropic

3. **Deploy**
   - Vercel automatically deploys on push to main branch
   - Preview deployments for pull requests

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- **Netlify**: Configure build command `npm run build` and publish directory `.next`
- **Railway**: Use Next.js template
- **AWS Amplify**: Connect repository and configure build settings
- **Docker**: See `Dockerfile` for containerization

---

## Key Features Deep Dive

### Multi-Select Filters
- Inline dropdowns on mobile (push content down instead of overlay)
- Separate mobile/desktop layouts for optimal UX
- Scroll position preservation during filtering

### Payment Tracking
- Flexible payment schedules (deposits, installments, final)
- Currency conversion (EUR → USD)
- Payment reminders (overdue, due today, 7-day advance)
- Refundable payment flags

### Activity Audit Trail
- Track all vendor actions (shared, status changed, notes added)
- Identify actor (planner or couple)
- Timestamps on all activities
- Query by couple or vendor

### Data Export
- CSV export of vendors with full payment details
- CSV export of RSVP data with guest information
- Currency conversion included in exports

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Sticky navigation headers
- Optimized modal layouts
- Horizontal scrolling for filter controls

---

## API Reference

### Planner APIs

**Couples**
- `GET /api/planner/couples` - List all couples
- `POST /api/planner/couples` - Create couple
- `GET /api/planner/couples/[id]` - Get couple details
- `PATCH /api/planner/couples/[id]` - Update couple
- `DELETE /api/planner/couples/[id]` - Delete couple
- `POST /api/planner/couples/[id]/invite` - Send invitation email
- `POST /api/planner/couples/parse` - Parse couple from text (AI)

**Vendor Library**
- `GET /api/planner/vendor-library` - List vendors (with filters)
- `POST /api/planner/vendor-library` - Create vendor
- `PATCH /api/planner/vendor-library/[id]` - Update vendor
- `DELETE /api/planner/vendor-library/[id]` - Delete vendor
- `POST /api/planner/vendor-library/parse` - Parse vendors (AI)
- `GET /api/planner/vendor-library/tags` - Get all tags
- `POST /api/planner/vendor-library/tags/suggest` - Get tag suggestions

**Vendor Sharing**
- `POST /api/planner/couples/[id]/vendors/bulk-share` - Share multiple vendors
- `GET /api/planner/couples/[id]/vendors` - Get shared vendors for couple
- `PATCH /api/planner/couples/[id]/vendors/[vendor_id]` - Update shared vendor

### Shared Couple APIs

- `GET /api/shared/[id]` - Fetch couple & vendors by share link
- `PATCH /api/shared/[id]/vendors/[vendor_id]` - Update vendor status/notes

### Admin APIs

- `PATCH /api/admin/vendors/[id]` - Update vendor
- `POST /api/admin/vendors/parse` - Parse vendors (AI)

### RSVP APIs

- `POST /api/rsvp/submit` - Submit RSVP
- `GET /api/rsvp/lookup` - Look up RSVP by name

---

## Troubleshooting

### Common Issues

**"Unauthorized" errors in vendor editing**
- Ensure you're logged in at `/couples` with the correct password
- Check that `ADMIN_PASSWORD` is set in environment variables

**AI parsing not working**
- Verify `ANTHROPIC_API_KEY` is correctly set
- Check API key has sufficient credits
- Ensure Claude Haiku 4.5 model is accessible

**Email sending fails**
- Verify SMTP credentials in environment variables
- For Gmail: use app-specific password, not account password
- Check firewall/network allows SMTP connections

**Database connection issues**
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure database migrations have been run

**Theme not persisting**
- Check browser localStorage is enabled
- Clear browser cache and cookies
- Verify theme context is properly wrapped around components

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

- Use TypeScript for type safety
- Follow existing code style and conventions
- Add comments for complex logic
- Test across mobile and desktop viewports
- Verify both themes (Pop and Heirloom)

---

## Documentation

Additional documentation available:

- `DESIGN_SYSTEM.md` - Complete design system and component guidelines
- `DATABASE_SETUP.md` - Detailed database schema and setup
- `PLANNER_IMPLEMENTATION.md` - Planner workspace technical details
- `DEVELOPMENT.md` - Development workflow and best practices
- `GET_STARTED.md` - Quick start guide for developers

---

## License

This project is part of the Bridezilla product demonstration.

---

## Support

For questions or issues:
- Create an issue in the repository
- Contact the development team
- Check existing documentation in `/docs`

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a service
- [Anthropic Claude](https://anthropic.com) - AI capabilities
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons
- [React Big Calendar](https://github.com/jquense/react-big-calendar) - Calendar component

---

**Made with ❤️ for wedding planners and couples everywhere**
