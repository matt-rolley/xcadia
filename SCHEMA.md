# Xcadia Database Schema Design

## Terminology

**Important naming conventions:**
- **Organization** (Database/Better Auth tables): We use Better Auth's "organization" plugin, so database tables use this term
- **Team** (UI/User-facing): In the app UI, we call "organizations" → "teams" (more intuitive for users)
- **Contact** (Database & UI): Our custom table for client contacts (stores company employees/contacts)

## Overview

Xcadia is expanding from a file management system into a full agency management platform with:
- **Mini-CRM** for managing client companies and their contacts
- **Portfolio Tool** for creating branded, shareable showcases of work
- **Project Management** for organizing work items
- **Deal Costing Tool** for pricing and quoting
- **Email Tracking** for portfolio delivery and engagement
- **Subscription Plans** for tiered features and usage limits

---

## Core Concepts

1. **Teams** = Internal teams using the platform (existing Better Auth feature)
2. **Companies** = External client companies managed by teams (CRM)
3. **Contacts** = Contacts at client companies (CRM)
4. **Projects** = Portfolio pieces/work items with files (e.g., website builds, branding projects)
5. **Portfolios** = Branded collections of projects sent to clients
6. **Deals** = Cost estimates/quotes for potential work

---

## Technology Stack

### Database Layer
- **Database**: PostgreSQL (Neon)
- **Migration Tool**: Kysely Migrations
- **Query Builder**: Kysely ORM
- **Type Generation**: `kysely-codegen` for TypeScript types
- **Commands**:
  ```bash
  # Generate types from schema
  bun run generate:types

  # Run migrations
  bunx kysely migrate:latest --config ./kysely.config.ts
  ```

### Backend
- **Server**: Nitro (Nuxt 4's server engine)
- **Runtime**: Bun
- **API Routes**: `/server/api/` directory
- **Server Utils**: `/server/utils/` for helpers
- **Authentication**: Better Auth with email/password, Google OAuth, and anonymous users

### Frontend
- **Framework**: Nuxt 4 with Vue 3 Composition API (`<script setup>`)
- **UI Library**: Nuxt UI 4 (Tailwind CSS)
- **State Management**: Pinia with Colada plugin
- **Data Fetching**: Nuxt's `useFetch` / `useAsyncData`

### File Storage
- **Provider**: Tigris (S3-compatible via Fly.io)
- **Upload Handling**: Server-side API routes
- **Media Processing**: FFmpeg for video transcoding (on upload via `/server/api/transcode`)
- **Supported Formats**:
  - Images (direct upload)
  - Videos (HLS streaming with FFmpeg transcoding)
  - 3D models (GLB format via Model Viewer; future: auto-convert to USDZ for iOS)

### Email
- **Provider**: Resend (modern, developer-friendly)
- **Features**:
  - Transactional emails for portfolios
  - Custom tracking pixels for open tracking
  - Link wrapping for click tracking
  - Review/approval workflow (optional, can be disabled)
- **Templates**: Store in `email_template` table with placeholder support

### Subscriptions & Billing
- **Provider**: Stripe (via Better Auth Stripe plugin)
- **Integration**: Better Auth handles subscription management, webhooks, and customer portal
- **Features**:
  - Self-service plan upgrades/downgrades
  - Stripe Customer Portal for billing management
  - Webhook handling for subscription events
  - Trial period support

### API Architecture
- **Design**: API-first architecture
- **Pattern**: All functionality exposed via RESTful API endpoints in `/server/api/`
- **UI**: Frontend consumes same APIs as external users
- **API Access**: Top-tier subscription plans include API access with customizable rate limits
- **Authentication**:
  - Internal: Better Auth session-based
  - External API: API keys with rate limiting (plan-based)

### Deployment
- **Primary**: Fly.io (configured in `fly.toml`)
- **Alternative**: NuxtHub (GitHub workflow available)
- **Region**: London (lhr)
- **Auto-scaling**: Configured with suspend/resume

---

## Existing Database Schema

### Application Tables

#### Folder Table
```typescript
folder {
  id: uuid (PK, auto-generated)
  parent: uuid (FK -> folder.id, cascade delete, nullable)
  name: varchar(255) (NOT NULL)
}
```
- Hierarchical structure supporting nested folders
- Self-referencing parent-child relationship

#### File Table
```typescript
file {
  id: uuid (PK, auto-generated)
  title: varchar(255) (NOT NULL)
  description: text (nullable)
  filename_disk: varchar(255) (NOT NULL)
  filename_download: varchar(255) (NOT NULL)
  mime_type: varchar(255) (NOT NULL)
  filesize: bigint (NOT NULL)
  folder: uuid (FK -> folder.id, cascade delete, nullable)
  tags: jsonb (NOT NULL, default {})
  metadata: jsonb (NOT NULL, default {})

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, cascade delete, NOT NULL)
  updated_by: text (FK -> user.id, cascade delete, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable, default NULL)
  deleted_by: text (FK -> user.id, cascade delete, nullable)
}
```
- Index on `folder` column for performance
- Supports soft deletion
- JSONB fields for flexible tags and custom metadata
- Full audit trail with creator/updater tracking

### Better Auth Tables (Auto-managed)

#### User Table
```typescript
user {
  id: text (PK)
  email: string
  name: string
  image?: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### Session Table
```typescript
session {
  id: string
  userId: string (FK -> user.id)
  expiresAt: Date
  activeTeamId?: string (custom field)
}
```

#### Account Table
```typescript
account {
  id: string
  userId: string (FK -> user.id)
  accountId: string
  providerId: string
}
```

#### Team Table (Better Auth Plugin)
```typescript
team {
  id: string (PK)
  name: string (NOT NULL)
  slug: string (NOT NULL, unique)
  logo: string (nullable)
  metadata: string (nullable)
  createdAt: Timestamp (NOT NULL)
}
```

#### Member Table (Better Auth Plugin)
```typescript
member {
  id: string (PK)
  teamId: string (FK -> team.id)
  userId: string (FK -> user.id)
  role: string (NOT NULL) // 'owner' | 'admin' | 'member'
  createdAt: Timestamp (NOT NULL)
}
```

#### Invitation Table (Better Auth Plugin)
```typescript
invitation {
  id: string (PK)
  teamId: string (FK -> team.id)
  email: string (NOT NULL)
  role: string (nullable)
  status: string (NOT NULL) // 'pending' | 'accepted' | 'rejected' | 'expired'
  inviterId: string (FK -> user.id)
  expiresAt: Timestamp (NOT NULL)
}
```

---

## New Database Tables

### 1. Company Table (Mini-CRM)
```typescript
company {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)
  name: varchar(255) (NOT NULL)
  slug: varchar(255) (NOT NULL) // URL-friendly identifier, unique within org
  website: varchar(255) (nullable)
  logo: varchar(255) (nullable) // S3 URL
  notes: text (nullable)

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- (team_id, slug) unique constraint
- deleted_at (for soft delete queries)
```

**Purpose**: Represents external client companies in the mini-CRM. Each team can manage multiple companies.

**Uniqueness**: Company slugs must be unique within each team (prevents duplicate companies per org).

**Relationship**: Teams (internal teams) manage Companies (external clients)

---

### 2. Contact Table (CRM Contacts)
```typescript
contact {
  id: uuid (PK, auto-generated)
  company_id: uuid (FK -> company.id, cascade delete, NOT NULL)
  first_name: varchar(255) (NOT NULL)
  last_name: varchar(255) (NOT NULL)
  email: varchar(255) (nullable)
  job_title: varchar(255) (nullable)
  notes: text (nullable)

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- company_id
- (company_id, email) unique constraint (email unique within company only)
- deleted_at
```

**Purpose**: Contacts at client companies. Multiple contacts per company. These are NOT users of the system (no login), but CRM contacts that can receive portfolios via email.

**Key Points**:
- Contacts cannot self-register; they must be added by team members
- **Email uniqueness**: Emails are unique within each company only (not globally). This prevents teams from discovering if other teams have added the same contact.
- No login/authentication for contacts (future feature: client portal)

---

### 3. Project Table (Portfolio Pieces)
```typescript
project {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)
  folder_id: uuid (FK -> folder.id, set null, nullable) // Each project gets its own folder
  company_id: uuid (FK -> company.id, set null, nullable) // Client the work was done for

  title: varchar(255) (NOT NULL)
  description: text (nullable)
  status: varchar(50) (NOT NULL, default 'draft') // 'draft' | 'published' | 'archived'
  is_public: boolean (NOT NULL, default false) // Can be shown publicly in portfolios

  // Optional metadata
  project_date: date (nullable) // When project was completed
  client_name: varchar(255) (nullable) // Display name if not linked to company
  tags: jsonb (NOT NULL, default {}) // For categorization

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- folder_id
- company_id
- status
- is_public
- deleted_at
```

**Purpose**: Represents portfolio pieces (websites, branding work, app development, etc.). A project is a collection of files showcasing completed work.

**Key Features**:
- Each project has its own dedicated folder for file storage
- Projects belong to teams (internal teams)
- **Optional company link**: Projects can be linked to a company (the client the work was done for)
  - Enables filtering: "Show all projects for Company X"
  - Auto-suggests relevant projects when creating portfolios for that company
  - Better CRM integration
- `is_public` flag: When true, project can be included in auto-generated portfolios
  - When false, project can still be manually added to portfolios (team decision)
  - Non-public projects are visible in portfolio selection UI
- Status workflow: draft → published → archived
- Projects can contain images, videos, and 3D models (GLB)

**Usage**: Projects are combined into portfolios and sent to clients (companies/contacts)

---

### 4. Portfolio Table
```typescript
portfolio {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)

  // Basic Info
  title: varchar(255) (NOT NULL)
  slug: varchar(255) (NOT NULL, unique) // For public URL: /p/{slug}
  description: text (nullable)

  // Branding
  logo: varchar(255) (nullable) // S3 URL
  company_name: varchar(255) (nullable) // Override org name
  primary_color: varchar(7) (nullable) // Hex color: #FF5733
  secondary_color: varchar(7) (nullable)

  // Access Control
  password: varchar(255) (nullable) // Hashed password for protected portfolios
  expires_at: timestamptz (nullable) // Auto-expire after date
  is_active: boolean (NOT NULL, default true) // Manual enable/disable

  // Welcome Message
  welcome_message: text (nullable)

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- slug (unique)
- expires_at
- is_active
- deleted_at
```

**Purpose**: A branded, shareable collection of projects sent to clients. Portfolios are the primary way to showcase work externally.

**Key Features**:
- **Branding**: Custom logo, colors, and company name per portfolio
- **Access Control**:
  - Optional password protection
  - Expiry dates (portfolios auto-disable after expiry)
  - Manual enable/disable toggle
- **Public URL**: Accessible at `/p/{slug}`
- **Welcome Message**: Custom intro text for recipients

**Conditional Rendering**: The portfolio viewing tool can conditionally render content based on who's viewing (via tracking token), allowing personalized experiences.

---

### 5. Portfolio Project Table (Many-to-Many)
```typescript
portfolio_project {
  id: uuid (PK, auto-generated)
  portfolio_id: uuid (FK -> portfolio.id, cascade delete, NOT NULL)
  project_id: uuid (FK -> project.id, cascade delete, NOT NULL)
  sort_order: integer (NOT NULL, default 0) // For custom ordering

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- portfolio_id
- project_id
- (portfolio_id, project_id) unique constraint
- (portfolio_id, sort_order) for ordering
```

**Purpose**: Links projects to portfolios. One project can appear in multiple portfolios. Supports custom ordering within each portfolio.

---

### 6. Portfolio File Table (Additional Attachments)
```typescript
portfolio_file {
  id: uuid (PK, auto-generated)
  portfolio_id: uuid (FK -> portfolio.id, cascade delete, NOT NULL)
  file_id: uuid (FK -> file.id, cascade delete, NOT NULL)
  sort_order: integer (NOT NULL, default 0)

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- portfolio_id
- file_id
- (portfolio_id, file_id) unique constraint
- (portfolio_id, sort_order)
```

**Purpose**: Allows adding individual files to portfolios (separate from project files). Useful for standalone PDFs, brochures, case studies, etc.

---

### 7. Portfolio Folder Table (Optional: Entire Folders)
```typescript
portfolio_folder {
  id: uuid (PK, auto-generated)
  portfolio_id: uuid (FK -> portfolio.id, cascade delete, NOT NULL)
  folder_id: uuid (FK -> folder.id, cascade delete, NOT NULL)
  sort_order: integer (NOT NULL, default 0)

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- portfolio_id
- folder_id
- (portfolio_id, folder_id) unique constraint
- (portfolio_id, sort_order)
```

**Purpose**: Allows adding entire folders to portfolios if needed (less common use case).

---

### 8. Portfolio Email Table (Email Tracking)
```typescript
portfolio_email {
  id: uuid (PK, auto-generated)
  portfolio_id: uuid (FK -> portfolio.id, cascade delete, NOT NULL)

  // Recipients
  recipient_email: varchar(255) (NOT NULL)
  recipient_name: varchar(255) (nullable)
  contact_id: uuid (FK -> contact.id, set null, nullable) // If sent to CRM contact
  company_id: uuid (FK -> company.id, set null, nullable) // For grouping

  // Email Content
  subject: varchar(255) (NOT NULL)
  message: text (nullable) // Custom message body
  template_id: uuid (FK -> email_template.id, set null, nullable)

  // Tracking
  sent_at: timestamptz (NOT NULL, default CURRENT_TIMESTAMP)
  sent_by: text (FK -> user.id, NOT NULL)
  opened_at: timestamptz (nullable) // First open
  last_opened_at: timestamptz (nullable) // Most recent open
  open_count: integer (NOT NULL, default 0)
  clicked_at: timestamptz (nullable) // First click (portfolio link)
  last_clicked_at: timestamptz (nullable)
  click_count: integer (NOT NULL, default 0)

  // Unique tracking token
  tracking_token: uuid (NOT NULL, unique) // For pixel/link tracking
}

Indexes:
- portfolio_id
- recipient_email
- contact_id
- company_id
- tracking_token (unique)
- sent_at
- opened_at (nullable for "not yet opened" queries)
```

**Purpose**: Tracks every portfolio email sent. Records opens/clicks for engagement analytics. Links to contacts/companies when applicable.

**Tracking Features**:
- **Email Opens**: Tracking pixel to detect when email is opened
- **Link Clicks**: Wrapped portfolio links to track clicks
- **Follow-up Notifications**: Can send reminders if email hasn't been opened/clicked after X days
- **Multi-recipient**: Portfolios can be sent to multiple people (even across different companies)

---

### 9. Email Template Table
```typescript
email_template {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)

  name: varchar(255) (NOT NULL) // Template name for selection
  subject: varchar(255) (NOT NULL) // Email subject line
  body: text (NOT NULL) // HTML/text body with placeholders

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- deleted_at
```

**Purpose**: Reusable email templates for sending portfolios. Supports placeholders like `{recipient_name}`, `{portfolio_link}`, `{company_name}`, etc.

---

### 10. Portfolio View Table (Analytics)
```typescript
portfolio_view {
  id: uuid (PK, auto-generated)
  portfolio_id: uuid (FK -> portfolio.id, cascade delete, NOT NULL)

  // Tracking Info
  tracking_token: uuid (FK -> portfolio_email.tracking_token, nullable) // If from email
  ip_address: varchar(45) (nullable) // IPv4/IPv6
  user_agent: text (nullable)
  referrer: varchar(255) (nullable)

  // Session
  session_id: uuid (NOT NULL) // Track unique sessions
  viewed_at: timestamptz (NOT NULL, default CURRENT_TIMESTAMP)
}

Indexes:
- portfolio_id
- tracking_token
- session_id
- viewed_at
```

**Purpose**: Tracks individual page views for analytics. Links to email tracking when applicable. Supports session-based analytics.

**Analytics Capabilities**:
- Who viewed the portfolio (via tracking token)
- When they viewed it
- How many times they viewed it
- Browser/device information
- Can show "Client viewed your portfolio" notifications

---

### 11. Deal Table (Cost Estimates/Quotes)
```typescript
deal {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)
  company_id: uuid (FK -> company.id, set null, nullable) // Client being quoted
  portfolio_id: uuid (FK -> portfolio.id, set null, nullable) // Portfolio sent to client

  // Basic Info
  title: varchar(255) (NOT NULL)
  description: text (nullable)
  status: varchar(50) (NOT NULL, default 'draft') // 'draft' | 'sent' | 'won' | 'lost'

  // Currency
  currency: varchar(3) (NOT NULL, default 'GBP') // Team default currency (ISO 4217)

  // Initial Estimate
  initial_estimate: decimal(10, 2) (nullable) // Ballpark figure before detailed costing

  // Contingency
  contingency_type: varchar(20) (NOT NULL, default 'percentage') // 'percentage' | 'fixed'
  contingency_value: decimal(10, 2) (NOT NULL, default 0) // Either % or fixed amount

  // Won/Lost Tracking
  proposed_cost: decimal(10, 2) (nullable) // Final amount proposed to client
  actual_cost: decimal(10, 2) (nullable) // Actual cost if won
  profit_margin: decimal(10, 2) (nullable) // Calculated: proposed - actual
  won_lost_at: timestamptz (nullable) // When marked won/lost
  won_lost_notes: text (nullable)

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- company_id
- portfolio_id
- status
- deleted_at
```

**Purpose**: Represents cost estimates/quotes for potential work. Tracks initial estimates, detailed costing scenarios, and won/lost outcomes with profit margins.

**Key Features**:
- **Portfolio Link**: Optional link to portfolio sent to client ("We sent them this portfolio, now we're creating a deal to quote the work")
- **Currency Support**: Each deal has a default currency, but individual line items can use different currencies
- **Initial Estimate**: Quick ballpark figure to compare against detailed costing
- **Contingency**: Can be percentage (e.g., 10%) or fixed amount (e.g., $5000)
- **Multiple Scenarios**: Each deal can have multiple pricing scenarios (see below)
- **Won/Lost Tracking**:
  - When won: Track proposed cost vs actual cost to calculate profit margin
  - When lost: Track for future reference

**Note**: Previously called "Tender" but renamed to "Deal" for clarity.

---

### 12. Deal Scenario Table (Multiple Pricing Options)
```typescript
deal_scenario {
  id: uuid (PK, auto-generated)
  deal_id: uuid (FK -> deal.id, cascade delete, NOT NULL)

  name: varchar(255) (NOT NULL) // e.g., "Basic", "Premium", "Enterprise"
  description: text (nullable)
  total_cost: decimal(10, 2) (NOT NULL, default 0) // Calculated from line items
  is_selected: boolean (NOT NULL, default false) // Which scenario was chosen
  sort_order: integer (NOT NULL, default 0)

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- deal_id
- (deal_id, sort_order)
```

**Purpose**: Multiple pricing scenarios per deal (e.g., basic vs premium packages). One scenario can be marked as selected when client chooses.

**Example**:
- Scenario 1: "Basic Package" - $10,000
- Scenario 2: "Premium Package" - $15,000
- Scenario 3: "Enterprise Package" - $25,000

---

### 13. Deal Line Item Table (Cost Breakdown)
```typescript
deal_line_item {
  id: uuid (PK, auto-generated)
  scenario_id: uuid (FK -> deal_scenario.id, cascade delete, NOT NULL)

  // Service/Team Info
  service_name: varchar(255) (NOT NULL) // e.g., "Frontend Development", "Design"
  description: text (nullable)

  // Costing
  rate_type: varchar(20) (NOT NULL) // 'hourly' | 'daily' | 'fixed'
  rate: decimal(10, 2) (NOT NULL) // Hourly/daily rate or fixed cost
  quantity: decimal(10, 2) (NOT NULL, default 1) // Hours, days, or units
  currency: varchar(3) (NOT NULL) // Currency for this line item (ISO 4217)
  total: decimal(10, 2) (NOT NULL) // rate * quantity

  sort_order: integer (NOT NULL, default 0)

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- scenario_id
- (scenario_id, sort_order)
```

**Purpose**: Individual line items in a costing scenario. Supports hourly, daily, and fixed pricing.

**Multi-Currency Support**: Each line item can have its own currency. The deal has a default currency, but line items can differ (e.g., outsourced work in EUR, hosting in USD). Future feature: automatic conversion to deal currency.

**Example Line Items**:
```
Service: Frontend Development
Rate Type: Hourly
Rate: $100/hr
Quantity: 80 hours
Total: $8,000

Service: Design
Rate Type: Daily
Rate: $800/day
Quantity: 10 days
Total: $8,000

Service: Hosting Setup
Rate Type: Fixed
Rate: $2,000
Quantity: 1
Total: $2,000
```

---

### 14. Deal Template Table (Reusable Cost Structures)
```typescript
deal_template {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)

  name: varchar(255) (NOT NULL)
  description: text (nullable)

  // Template can store default scenarios and line items as JSON
  template_data: jsonb (NOT NULL) // Serialized scenarios and line items

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  updated_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  deleted_at: timestamptz (nullable)
  deleted_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- deleted_at
```

**Purpose**: Save/load reusable cost structures. Templates store scenarios and line items as JSON for quick deal creation.

**Use Case**: Create templates like "Standard Website Build" or "Mobile App Development" that can be loaded and customized for each new deal.

---

### 15. Subscription Plan Table
```typescript
subscription_plan {
  id: uuid (PK, auto-generated)

  name: varchar(255) (NOT NULL) // e.g., "Free", "Pro", "Enterprise"
  slug: varchar(255) (NOT NULL, unique) // e.g., "free", "pro", "enterprise"
  description: text (nullable)

  // Stripe Integration
  stripe_product_id: varchar(255) (nullable, unique) // Stripe Product ID
  stripe_price_id_monthly: varchar(255) (nullable) // Stripe Price ID (monthly)
  stripe_price_id_yearly: varchar(255) (nullable) // Stripe Price ID (yearly)

  // Pricing
  price_monthly: decimal(10, 2) (NOT NULL) // Monthly price
  price_yearly: decimal(10, 2) (NOT NULL) // Yearly price (discounted)
  currency: varchar(3) (NOT NULL, default 'GBP')

  // Feature Limits
  max_storage_gb: integer (NOT NULL) // Total storage in GB
  max_file_size_mb: integer (NOT NULL) // Max file upload size in MB
  max_projects: integer (nullable) // Null = unlimited
  max_portfolios: integer (nullable) // Null = unlimited
  max_companies: integer (nullable) // Null = unlimited

  // Email Limits
  max_email_recipients_per_send: integer (NOT NULL) // Max recipients per portfolio email
  max_emails_per_day: integer (NOT NULL) // Daily email sending limit
  email_review_required: boolean (NOT NULL, default false) // Require approval before sending

  // API Access
  api_access_enabled: boolean (NOT NULL, default false) // Enable external API access
  api_rate_limit_per_minute: integer (nullable) // API requests per minute (null = no API access)
  api_rate_limit_per_day: integer (nullable) // API requests per day (null = unlimited if enabled)

  // Features
  features: jsonb (NOT NULL, default {}) // Additional features as JSON

  is_active: boolean (NOT NULL, default true) // Can be selected
  sort_order: integer (NOT NULL, default 0) // Display order

  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- slug (unique)
- stripe_product_id (unique, nullable)
- is_active
- sort_order
```

**Purpose**: Defines subscription tiers with usage limits and pricing. Integrates with Stripe via Better Auth for billing.

**Key Features**:
- **Stripe Integration**: Links to Stripe Products and Prices for billing automation
- **Storage Limits**: max_storage_gb (total) and max_file_size_mb (per upload)
- **Resource Limits**: max_projects, max_portfolios, max_companies (null = unlimited)
- **Email Limits**: Control recipients per send and daily sending limits
- **Email Review**: Can require approval workflow before sending portfolios
- **API Access**: Top-tier plans can enable external API access with rate limiting
- **Flexible Features**: JSONB field for additional features (custom domains, advanced analytics, etc.)

**Example Plans**:
```
Free Plan:
- £0/month
- 5GB storage, 50MB file size
- 10 projects, 3 portfolios, 5 companies
- 5 recipients/send, 20 emails/day
- Email review required
- No API access

Pro Plan:
- £29/month (£290/year)
- 100GB storage, 500MB file size
- Unlimited projects/portfolios/companies
- 50 recipients/send, 500 emails/day
- Email review optional
- No API access

Enterprise Plan:
- £99/month (£990/year)
- 1TB storage, 2GB file size
- Unlimited everything
- 500 recipients/send, unlimited emails/day
- Email review optional
- **API Access**: 1000 requests/min, 100,000 requests/day
- Custom features: custom domains, white-label, priority support

API Add-on (for Pro+):
- Add £49/month to any plan
- API Access: 500 requests/min, 50,000 requests/day
- Generate and manage API keys
- Access full REST API
```

**Stripe Integration Notes**:
- Better Auth Stripe plugin manages subscriptions automatically
- Webhooks handle subscription.created, subscription.updated, subscription.deleted
- Customer Portal allows users to manage billing, change plans, cancel subscriptions
- Trial periods supported via Stripe trial configuration

---

### 16. Team Subscription Table
```typescript
team_subscription {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL, unique)
  plan_id: uuid (FK -> subscription_plan.id, NOT NULL)

  // Stripe Integration (via Better Auth)
  stripe_customer_id: varchar(255) (nullable, unique) // Stripe Customer ID
  stripe_subscription_id: varchar(255) (nullable, unique) // Stripe Subscription ID

  // Subscription Status
  status: varchar(50) (NOT NULL, default 'active') // 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

  // Billing
  billing_cycle: varchar(20) (NOT NULL, default 'monthly') // 'monthly' | 'yearly'
  current_period_start: timestamptz (NOT NULL)
  current_period_end: timestamptz (NOT NULL)
  trial_end: timestamptz (nullable) // If trialing
  cancel_at_period_end: boolean (NOT NULL, default false) // User requested cancellation

  // Usage Tracking
  storage_used_gb: decimal(10, 2) (NOT NULL, default 0) // Current storage usage
  projects_count: integer (NOT NULL, default 0) // Current project count
  portfolios_count: integer (NOT NULL, default 0) // Current portfolio count
  companies_count: integer (NOT NULL, default 0) // Current company count
  emails_sent_today: integer (NOT NULL, default 0) // Reset daily
  last_email_count_reset: date (NOT NULL, default CURRENT_DATE) // For daily reset

  // API Usage Tracking
  api_requests_this_minute: integer (NOT NULL, default 0) // Rate limiting (per minute)
  api_requests_today: integer (NOT NULL, default 0) // Daily API usage
  last_api_minute_reset: timestamptz (NOT NULL, default CURRENT_TIMESTAMP) // For minute reset
  last_api_day_reset: date (NOT NULL, default CURRENT_DATE) // For daily reset

  // Timestamps
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  updated_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- team_id (unique - one subscription per org)
- plan_id
- stripe_customer_id (unique, nullable)
- stripe_subscription_id (unique, nullable)
- status
- current_period_end (for renewal checks)
- last_email_count_reset (for daily reset jobs)
- last_api_day_reset (for API daily reset jobs)
```

**Purpose**: Tracks each team's subscription, usage, and limits. Syncs with Stripe via Better Auth webhooks.

**Key Features**:
- **One subscription per team**: Unique constraint on team_id
- **Stripe Integration**: Customer and Subscription IDs synced via Better Auth
- **Usage Tracking**: Real-time tracking of storage, projects, portfolios, companies
- **Email Rate Limiting**: Daily counter that resets automatically
- **API Rate Limiting**: Per-minute and daily counters for external API access
- **Billing Cycles**: Support for monthly and yearly billing
- **Trial Support**: Optional trial_end date for trial periods
- **Cancellation**: cancel_at_period_end flag for graceful subscription endings

**Usage Enforcement**:
- Before uploading files: Check `storage_used_gb + new_file_size <= plan.max_storage_gb`
- Before creating projects: Check `projects_count < plan.max_projects`
- Before sending emails: Check `emails_sent_today < plan.max_emails_per_day`
- File upload validation: Check `file_size <= plan.max_file_size_mb`
- API requests: Check `api_requests_this_minute < plan.api_rate_limit_per_minute` and `api_requests_today < plan.api_rate_limit_per_day`

**Better Auth Integration**:
- Better Auth Stripe plugin handles webhook processing
- Subscription status automatically updated when Stripe events fire
- Customer Portal redirects managed by Better Auth
- Trial conversions handled automatically

---

### 17. API Token Table (Better Auth Bearer Tokens)
```typescript
api_token {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)
  user_id: text (FK -> user.id, cascade delete, NOT NULL) // Token owner

  // Token Info
  name: varchar(255) (NOT NULL) // User-friendly name (e.g., "Production API", "Staging")
  token_hash: varchar(255) (NOT NULL, unique) // Hashed Better Auth session token

  // Permissions
  permissions: jsonb (NOT NULL, default {}) // Granular permissions (read:projects, write:portfolios, etc.)
  scopes: text[] (NOT NULL, default ARRAY[]::text[]) // API scopes: ['projects:read', 'portfolios:write']

  // Status
  is_active: boolean (NOT NULL, default true) // Can be disabled without deletion
  last_used_at: timestamptz (nullable) // Last API request timestamp
  last_used_ip: varchar(45) (nullable) // Last IP that used this token

  // Expiry
  expires_at: timestamptz (nullable) // Optional expiration date

  // Soft Delete + Audit Trail
  created_by: text (FK -> user.id, NOT NULL)
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
  revoked_at: timestamptz (nullable) // When token was revoked
  revoked_by: text (FK -> user.id, nullable)
}

Indexes:
- team_id
- user_id
- token_hash (unique)
- is_active
- expires_at (for expiry checks)
```

**Purpose**: Tracks metadata and permissions for Better Auth bearer tokens used for external API access. Works alongside Better Auth's built-in bearer token plugin.

**Key Features**:
- **Better Auth Integration**: Uses Better Auth's bearer token plugin for token generation and validation
- **Metadata Storage**: Stores token name, permissions, and usage stats (Better Auth doesn't store this)
- **Granular Permissions**: JSONB field + scopes array for fine-grained access control
- **Usage Tracking**: last_used_at and last_used_ip for monitoring
- **Revocation**: Tokens can be disabled without deleting from Better Auth session table

**Better Auth Setup**:
```typescript
import { bearer } from "better-auth/plugins"

export const auth = betterAuth({
  plugins: [
    bearer({
      requireSignature: true // Enhanced token security
    })
  ]
})
```

**Token Flow**:
1. User creates API token in UI (only if plan includes API access)
2. System calls Better Auth to create new session → receives bearer token
3. Store token hash + metadata in `api_token` table
4. Display full token ONCE to user (stored in `set-auth-token` header)
5. External requests: `Authorization: Bearer <token>`
6. Better Auth validates token → get session
7. Lookup `api_token` table by token_hash for permissions/scopes
8. Enforce: is_active, expires_at, rate limits, permissions
9. Update last_used_at and increment API usage counters

**Scope Examples**:
```javascript
// Scopes array
['projects:read', 'projects:write', 'portfolios:read', 'companies:read', 'files:upload']

// Permissions JSONB (more flexible)
{
  "projects": ["read", "write"],
  "portfolios": ["read"],
  "companies": ["read", "write"]
}
```

**Advantages of Better Auth Bearer**:
- ✅ No need to implement custom token generation/hashing
- ✅ Leverages Better Auth's built-in security
- ✅ Token validation handled by Better Auth
- ✅ Works seamlessly with existing session management
- ✅ Signature verification available via `requireSignature` option

---

### 18. Audit Log Table
```typescript
audit_log {
  id: uuid (PK, auto-generated)
  team_id: string (FK -> team.id, cascade delete, NOT NULL)

  // Entity Info
  entity_type: varchar(100) (NOT NULL) // 'company' | 'contact' | 'project' | 'portfolio' | 'deal' | etc.
  entity_id: uuid (NOT NULL) // ID of the entity that changed

  // Change Info
  action: varchar(50) (NOT NULL) // 'created' | 'updated' | 'deleted' | 'restored'
  old_data: jsonb (nullable) // Previous state (for updates/deletes)
  new_data: jsonb (nullable) // New state (for creates/updates)
  changes: jsonb (nullable) // Specific fields that changed (for updates)

  // User Info
  user_id: text (FK -> user.id, NOT NULL) // Who made the change
  user_email: varchar(255) (nullable) // Cached for display
  user_name: varchar(255) (nullable) // Cached for display

  // Request Info
  ip_address: varchar(45) (nullable) // IPv4/IPv6
  user_agent: text (nullable) // Browser/device info

  // Timestamp
  created_at: timestamptz (default CURRENT_TIMESTAMP, NOT NULL)
}

Indexes:
- team_id
- entity_type
- entity_id
- (entity_type, entity_id) for finding all changes to an entity
- user_id
- action
- created_at (for time-based queries)
```

**Purpose**: Complete audit trail of all entity changes for compliance and debugging.

**Key Features**:
- **Full History**: Tracks all creates, updates, deletes, and restores
- **Diff Tracking**: `changes` field contains only modified fields for updates
- **User Context**: Captures who made the change with cached display info
- **Request Context**: IP and user agent for security auditing
- **Team Scoped**: All audit logs are scoped to teams

**Example Audit Log Entry (Update)**:
```json
{
  "entity_type": "project",
  "entity_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "updated",
  "old_data": {"title": "Old Project Name", "status": "draft", "is_public": false},
  "new_data": {"title": "New Project Name", "status": "published", "is_public": true},
  "changes": {"title": "New Project Name", "status": "published", "is_public": true},
  "user_id": "user123",
  "user_email": "john@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Implementation Note**: Audit logs should be written via database triggers or application middleware to ensure they're never missed.

---

## Updated Existing Tables

### File Table - Add Public Flag
```typescript
// Add to existing file table:
file {
  // ... existing fields ...
  is_public: boolean (NOT NULL, default false) // Can be shown in public portfolios
}
```

**Purpose**: Marks files that can be included in public/auto-generated portfolios. Gives granular control over what's shareable.

---

### Folder Table - Add Relations
```typescript
// Add to existing folder table:
folder {
  // ... existing fields ...
  team_id: string (FK -> team.id, set null, nullable)
  project_id: uuid (FK -> project.id, set null, nullable)
}

Indexes:
- team_id
- project_id
```

**Purpose**: Links folders to teams and projects for proper hierarchy and access control.

---

## Folder Hierarchy for Projects

To implement "each project gets its own folder under an team parent folder":

### Folder Structure
```
Root Folders
└── Team A Root Folder (team_id: 'org-123', parent: null)
    ├── Project 1 Folder (project_id: 'proj-1', parent: 'org-123-root')
    │   ├── hero-image.jpg
    │   ├── demo-video.mp4
    │   └── 3d-model.glb
    └── Project 2 Folder (project_id: 'proj-2', parent: 'org-123-root')
        ├── screenshot-1.png
        └── walkthrough.mp4
```

### Implementation
1. When an team is created, create a root folder for it
2. When a project is created, create a dedicated folder as a child of the org root folder
3. All files uploaded to a project go into that project's folder
4. Access control is enforced at the team level

---

## Entity Relationships Summary

```
Subscription Plan (new)
└── has many → Team Subscriptions

Team (existing)
├── has one → Team Subscription (usage & limits)
├── has many → API Tokens (for external access via Better Auth bearer)
├── has many → Companies (CRM)
├── has many → Projects (portfolio pieces)
├── has many → Portfolios (shareable showcases)
├── has many → Deals (cost estimates)
├── has many → Email Templates
├── has many → Deal Templates
├── has many → Root Folders
├── has many → Audit Logs
└── has many → Members (internal team)

Team Subscription (new)
├── belongs to → Team (one-to-one)
├── belongs to → Subscription Plan
├── links to → Stripe Customer (via stripe_customer_id)
├── links to → Stripe Subscription (via stripe_subscription_id)
└── tracks usage: storage, projects, portfolios, companies, emails, API requests

API Token (new)
├── belongs to → Team
├── belongs to → User (token owner)
├── wraps → Better Auth Bearer Token (validation handled by Better Auth)
└── tracks: name, permissions, scopes, last_used_at, last_used_ip

Company (new)
├── belongs to → Team
├── has many → Contacts (contacts)
├── has many → Projects (work done for them)
└── has many → Deals (quotes/estimates)

Contact (new)
├── belongs to → Company
└── has many → Portfolio Emails (sent to them)

Project (new)
├── belongs to → Team
├── belongs to → Company (optional - client)
├── has one → Folder (dedicated project folder)
├── belongs to many → Portfolios (via portfolio_project)
└── has many → Files (via project's folder)

Portfolio (new)
├── belongs to → Team
├── has many → Projects (via portfolio_project)
├── has many → Files (via portfolio_file)
├── has many → Folders (via portfolio_folder)
├── has many → Emails (sent)
├── has many → Deals (linked opportunities)
└── has many → Views (analytics)

Portfolio Email (new)
├── belongs to → Portfolio
├── belongs to → Contact (optional)
├── belongs to → Company (optional)
├── belongs to → Email Template (optional)
└── has many → Portfolio Views (via tracking token)

Deal (new)
├── belongs to → Team
├── belongs to → Company (optional - client)
├── belongs to → Portfolio (optional - work showcase)
└── has many → Scenarios

Deal Scenario (new)
├── belongs to → Deal
└── has many → Line Items

Deal Line Item (new)
└── belongs to → Deal Scenario

Audit Log (new)
├── belongs to → Team
├── tracks → Any Entity (entity_type + entity_id)
└── records → User who made the change

File (existing - updated)
└── is_public flag for portfolio visibility

Folder (existing - updated)
├── can belong to → Team (root folder)
└── can belong to → Project (project folder)
```

---

## Key Design Decisions

1. **Soft Delete Everywhere**: All main entities support soft delete for data recovery
2. **Audit Trail**: All changes tracked with `created_by`, `updated_by`, timestamps + separate `audit_log` table
3. **JSONB for Flexibility**: Tags, metadata, and template data use JSONB for schema flexibility
4. **Multi-tenancy**: Team-scoped data prevents cross-team access
5. **Folder Hierarchy**: Leverages existing folder system with team/project links
6. **Tracking Tokens**: UUID-based tracking for secure, anonymous analytics
7. **Decimal for Money**: Use `decimal(10, 2)` for precise currency calculations
8. **Scenarios for Pricing**: Allows presenting multiple options to clients
9. **Separation of Concerns**: Projects (portfolio pieces) vs Deals (cost estimates) are distinct
10. **No Client Logins (Yet)**: Contacts are CRM contacts, not system users (but future-ready for client portals)
11. **Subscription Plans**: Flexible plan-based limits for storage, uploads, emails, and resources
12. **Usage Tracking**: Real-time usage monitoring per team with plan enforcement
13. **Slug-based Uniqueness**: Companies have unique slugs within teams (not names)
14. **Email Uniqueness**: Contact emails unique per company only (not globally, for privacy)
15. **Multi-Currency Support**: Deals have default currency; line items can differ (future: auto-conversion)
16. **Portfolio Expiry**: Auto-disable (not delete) with "contact owner" option
17. **Public Flag Flexibility**: Non-public projects can still be manually added to portfolios (team decision)
18. **Cross-entity Linking**: Projects link to companies, Deals link to portfolios (full CRM integration)

---

## Implementation Phases

### Phase 1: CRM Foundation
**Goal**: Build mini-CRM for managing client companies and contacts

**Tasks**:
1. Create migration for `company` table
2. Create migration for `contact` table
3. Build CRUD APIs for companies (`/api/companies/*`)
4. Build CRUD APIs for contacts (`/api/contacts/*`)
5. Create UI pages for company management
6. Create UI pages for contact management
7. Implement team-level root folder creation

**Deliverables**:
- Teams can create/edit/delete companies
- Teams can add/manage contacts per company
- Basic CRM views (company list, company detail with contacts)

---

### Phase 2: Projects & Folders
**Goal**: Create portfolio pieces with dedicated file storage

**Tasks**:
1. Create migration for `project` table
2. Create migration to update `folder` table (add team_id, project_id)
3. Create migration to update `file` table (add is_public flag)
4. Build APIs for project CRUD (`/api/projects/*`)
5. Implement auto-folder creation when project is created
6. Build project creation UI with folder selection
7. Build project detail page with file upload
8. Add file management interface for project files
9. Implement `is_public` toggle for projects and files
10. Create project list/grid views with filters (status, is_public, tags)

**Deliverables**:
- Teams can create projects with titles, descriptions, and statuses
- Each project gets its own dedicated folder
- Files can be uploaded to projects
- Projects and files can be marked as public

---

### Phase 3: Portfolio System
**Goal**: Create branded, shareable collections of projects

**Tasks**:
1. Create migrations for portfolio tables:
   - `portfolio`
   - `portfolio_project`
   - `portfolio_file`
   - `portfolio_folder`
2. Build APIs for portfolio management (`/api/portfolios/*`)
3. Build portfolio creation UI:
   - Basic info (title, slug, description)
   - Project selection (drag-and-drop ordering)
   - File/folder attachment
   - Branding customization (logo upload, color pickers)
4. Implement public portfolio viewer at `/p/{slug}`
5. Build portfolio viewer features:
   - Responsive design for all devices
   - Image galleries
   - Video playback (including HLS)
   - 3D model viewer
   - Custom branding display
6. Implement access control:
   - Password protection (bcrypt hashing)
   - Expiry date checking
   - Active/inactive toggle
7. Create portfolio management dashboard (list, edit, delete)

**Deliverables**:
- Teams can create branded portfolios
- Portfolios can contain multiple projects, files, and folders
- Public portfolio viewer with custom branding
- Password protection and expiry dates work
- Portfolios can be enabled/disabled manually

---

### Phase 4: Email & Tracking
**Goal**: Send portfolios via email with engagement tracking

**Tasks**:
1. Create migrations for email tables:
   - `email_template`
   - `portfolio_email`
   - `portfolio_view`
2. Choose and integrate email service provider (Resend recommended)
3. Build email template management:
   - CRUD APIs (`/api/email-templates/*`)
   - Template editor UI with placeholder support
   - Preview functionality
4. Build portfolio email sending:
   - UI for composing emails to contacts
   - Template selection
   - Multi-recipient support
   - Tracking token generation
5. Implement email tracking:
   - Tracking pixel endpoint (`/api/tracking/pixel/{token}`)
   - Link wrapping for click tracking
   - Open/click event recording
6. Build email tracking APIs (`/api/portfolio-emails/*`)
7. Implement portfolio view tracking:
   - View event recording on portfolio page load
   - Session tracking
   - IP/user-agent logging
8. Build analytics dashboard:
   - Email send history
   - Open/click rates
   - Portfolio view statistics
   - Per-recipient engagement
9. Implement follow-up notifications:
   - Scheduled job to check unopened emails
   - Notification system for team members
   - "Send reminder" functionality

**Deliverables**:
- Teams can create reusable email templates
- Portfolios can be sent to multiple recipients
- Email opens and clicks are tracked
- Portfolio views are recorded with session data
- Analytics dashboard shows engagement metrics
- Follow-up reminders for unopened portfolios

---

### Phase 5: Deal Costing
**Goal**: Create detailed cost estimates with scenarios

**Tasks**:
1. Create migrations for deal tables:
   - `deal`
   - `deal_scenario`
   - `deal_line_item`
   - `deal_template`
2. Build deal CRUD APIs (`/api/deals/*`)
3. Build deal creation UI:
   - Basic info (title, description, company link)
   - Initial estimate input
   - Contingency calculator (percentage/fixed toggle)
4. Build scenario management:
   - Add/edit/delete scenarios
   - Scenario selection (mark as chosen)
   - Drag-and-drop scenario ordering
5. Build line item interface:
   - Add/edit/delete line items per scenario
   - Rate type selector (hourly/daily/fixed)
   - Auto-calculation of totals
   - Drag-and-drop ordering
6. Implement cost calculations:
   - Line item totals (rate × quantity)
   - Scenario totals (sum of line items)
   - Contingency application
   - Final total with contingency
7. Build won/lost tracking:
   - Status update UI (draft → sent → won/lost)
   - Proposed cost input
   - Actual cost input (if won)
   - Auto-calculate profit margin
   - Notes field for outcome
8. Build deal template system:
   - Save current deal as template
   - Template selection when creating deal
   - Load template scenarios and line items
   - Template management UI
9. Build deal reporting:
   - List view with filters (status, company, date)
   - Win/loss rate analytics
   - Profit margin reports
   - Comparison: initial estimate vs final cost

**Deliverables**:
- Teams can create detailed cost estimates
- Multiple pricing scenarios per deal
- Flexible line items (hourly, daily, fixed)
- Contingency calculations (percentage or fixed)
- Won/lost tracking with profit margins
- Reusable deal templates
- Reporting and analytics

---

### Phase 6: Future Enhancements
**Goal**: Advanced features for long-term growth

**Potential Features**:
1. **Client Portal**:
   - Client login system (extend Better Auth)
   - View assigned projects
   - Comment on projects
   - File sharing between org and client
   - Approval workflows

2. **Calendar/Appointments**:
   - Calendar integration (Google Calendar, Outlook)
   - Booking slots on portfolio pages (call-to-action)
   - Appointment management for follow-ups
   - Automated reminders

3. **Auto-generated Portfolios**:
   - Public portfolio auto-generation based on project tags/categories
   - Dynamic portfolio creation when client requests via form
   - API endpoint for external portfolio requests

4. **Advanced Portfolio Features**:
   - Custom domains per portfolio
   - Advanced analytics (heatmaps, scroll depth, time on page)
   - Video testimonials
   - Interactive elements (polls, forms)
   - Social sharing buttons

5. **Deal Enhancements**:
   - PDF export for deal documents
   - E-signature integration
   - Invoice generation from won deals
   - Time tracking integration
   - Expense tracking

6. **CRM Enhancements**:
   - Lead scoring
   - Sales pipeline stages
   - Activity timeline (calls, meetings, emails)
   - Task/reminder system
   - Integration with external CRMs (HubSpot, Salesforce)

---

## Migration Order

When implementing, create migrations in this order to respect foreign key constraints:

### Phase 0: Subscription & Audit Infrastructure
1. `subscription_plan` (standalone table)
2. `team_subscription` (depends on team, subscription_plan)
3. `api_token` (depends on team, user) // Metadata for Better Auth bearer tokens
4. `audit_log` (depends on team, user)

### Phase 1: CRM Foundation
5. `company` (depends on team)
6. `contact` (depends on company)

### Phase 2: Projects & Files
7. Update `folder` (add team_id, project_id)
8. Update `file` (add is_public flag)
9. `project` (depends on team, folder, company)

### Phase 3: Portfolio System
10. `portfolio` (depends on team)
11. `portfolio_project` (depends on portfolio, project)
12. `portfolio_file` (depends on portfolio, file)
13. `portfolio_folder` (depends on portfolio, folder)

### Phase 4: Email & Tracking
14. `email_template` (depends on team)
15. `portfolio_email` (depends on portfolio, contact, company, email_template)
16. `portfolio_view` (depends on portfolio, portfolio_email)

### Phase 5: Deal Costing
17. `deal` (depends on team, company, portfolio)
18. `deal_scenario` (depends on deal)
19. `deal_line_item` (depends on deal_scenario)
20. `deal_template` (depends on team)

**Note**: Subscription & Audit tables (Phase 0) should be created first to enable usage tracking, API key management, and audit logging from the beginning. This allows enforcement of subscription limits and API access control throughout the application.

---

## API Endpoint Structure

Recommended RESTful API structure:

```
/api/companies
  GET    /               - List companies for team
  POST   /               - Create company
  GET    /:id            - Get company details
  PUT    /:id            - Update company
  DELETE /:id            - Soft delete company

/api/contacts
  GET    /               - List contacts (with company filter)
  POST   /               - Create contact
  GET    /:id            - Get contact details
  PUT    /:id            - Update contact
  DELETE /:id            - Soft delete contact

/api/projects
  GET    /               - List projects for team
  POST   /               - Create project (auto-creates folder)
  GET    /:id            - Get project details with files
  PUT    /:id            - Update project
  DELETE /:id            - Soft delete project
  POST   /:id/files      - Upload files to project folder

/api/portfolios
  GET    /               - List portfolios for team
  POST   /               - Create portfolio
  GET    /:id            - Get portfolio details
  PUT    /:id            - Update portfolio
  DELETE /:id            - Soft delete portfolio
  POST   /:id/projects   - Add projects to portfolio
  DELETE /:id/projects/:projectId - Remove project from portfolio
  POST   /:id/send       - Send portfolio via email

/api/email-templates
  GET    /               - List templates for team
  POST   /               - Create template
  GET    /:id            - Get template
  PUT    /:id            - Update template
  DELETE /:id            - Soft delete template

/api/portfolio-emails
  GET    /               - List sent emails with tracking
  GET    /:id            - Get email details with analytics

/api/deals
  GET    /               - List deals for team
  POST   /               - Create deal
  GET    /:id            - Get deal with scenarios
  PUT    /:id            - Update deal
  DELETE /:id            - Soft delete deal
  POST   /:id/scenarios  - Add scenario to deal
  PUT    /scenarios/:scenarioId - Update scenario
  POST   /scenarios/:scenarioId/items - Add line item
  PUT    /items/:itemId  - Update line item

/api/deal-templates
  GET    /               - List templates for team
  POST   /               - Create template from deal
  GET    /:id            - Get template
  DELETE /:id            - Soft delete template

/api/tracking
  GET    /pixel/:token   - Tracking pixel (records email open)
  GET    /link/:token    - Link redirect (records click)

// Public routes (no auth required)
/p/:slug                 - View portfolio (checks password/expiry)
/p/:slug/view            - Record portfolio view event
```

---

## Security Considerations

1. **Multi-tenancy**: All queries must be scoped to user's active team
2. **Soft Delete**: Never expose soft-deleted records in queries
3. **Password Protection**: Use bcrypt for portfolio passwords
4. **Tracking Tokens**: Use UUIDs (not sequential IDs) for privacy
5. **File Access**: Enforce team/project-based access control on S3 URLs
6. **Rate Limiting**: Implement rate limits on public portfolio views
7. **Email Validation**: Validate email addresses before sending
8. **SQL Injection**: Use Kysely's parameterized queries
9. **XSS Protection**: Sanitize user input in descriptions, messages, etc.
10. **CSRF**: Use Nuxt's built-in CSRF protection

---

## Testing Strategy

### Unit Tests
- API route handlers
- Kysely query builders
- Utility functions (cost calculations, contingency, profit margin)
- Email template placeholder replacement

### Integration Tests
- Multi-table operations (creating project with folder)
- Cascade deletes (deleting portfolio deletes portfolio_project records)
- Soft delete queries (don't return deleted records)
- Team scoping (user can't access other org's data)

### E2E Tests (When Test Framework Added)
- Complete user workflows:
  - Create company → add contacts → create project → upload files
  - Create portfolio → add projects → send email → track views
  - Create deal → add scenarios → add line items → mark won/lost
- Email sending and tracking
- Portfolio viewer functionality
- Password-protected portfolio access

---

## Performance Considerations

1. **Database Indexes**: All foreign keys and commonly queried fields are indexed
2. **Pagination**: Implement cursor-based pagination for large lists
3. **Lazy Loading**: Load portfolio projects/files on-demand
4. **Caching**: Cache public portfolios with Redis/KV
5. **CDN**: Serve portfolio assets via CDN
6. **Image Optimization**: Resize/compress images on upload
7. **Video Streaming**: Use HLS for efficient video delivery
8. **Batch Operations**: Use Kysely's batch insert/update for line items
9. **Query Optimization**: Use joins instead of N+1 queries
10. **Analytics Aggregation**: Pre-calculate statistics for dashboards

---

## Data Migrations & Backups

1. **Migration Strategy**: Always use Kysely migrations, never manual SQL
2. **Rollback Plan**: Each migration should have a `down()` method
3. **Data Seeding**: Create seed scripts for development/testing
4. **Backups**: Configure Neon automated backups
5. **Staging Environment**: Test migrations on staging before production

---

## Future Database Optimizations

1. **Materialized Views**: Pre-compute portfolio analytics
2. **Full-Text Search**: Add PostgreSQL full-text search for projects/companies
3. **Partitioning**: Partition `portfolio_view` by date for performance
4. **Read Replicas**: Use read replicas for analytics queries
5. **Archiving**: Archive old deleted records to separate table

---

## Design Decisions Summary

All major design questions have been answered. Here's a summary of key decisions:

### ✅ Resolved Design Decisions

1. **File Upload Limits**: Plan-based limits via `subscription_plan` table (see tables 15-16)
2. **Email Service**: Resend (modern, developer-friendly)
3. **Email Sending Limits**: Plan-based limits with review/approval workflow (optional)
4. **Portfolio Expiry**: Auto-disable (not delete). Show expired message with "contact owner" button
5. **Deal Currency**: Multi-currency support. Each deal has default currency; line items can differ. Future: auto-conversion
6. **User Permissions**: Owner/Admin (full access) and Member (everything except org settings/billing)
7. **Company Deduplication**: Company slug must be unique within team
8. **Contact Email Uniqueness**: Unique within company only (not globally, for privacy)
9. **Audit Log**: Yes, full audit trail via `audit_log` table (table 17)
10. **Project-to-Company Link**: Yes, optional `company_id` on projects
11. **Deal-to-Portfolio Link**: Yes, optional `portfolio_id` on deals
12. **Public Project Visibility**: Non-public projects can still be manually added to portfolios
13. **3D Model Formats**: GLB only (future: auto-convert to USDZ for iOS)
14. **Video Transcoding**: On upload via `/server/api/transcode`

### ⚠️ Outstanding Questions (To Be Decided)

1. **Tracking Privacy (GDPR)**:
   - Should we anonymize IP addresses for EU visitors?
   - Need a cookie consent banner for portfolio views?
   - Should users be able to opt-out of tracking?
   - **Current Status**: TBD - implement basic tracking now, add privacy controls later

2. **Portfolio Expired Message**:
   - What should the "contact owner" button do?
   - Show team email? Allow message form? Redirect to team website?
   - **Recommendation**: Show a contact form that sends email to portfolio creator

3. **Payment Integration**:
   - ✅ **Provider**: Stripe (via Better Auth Stripe plugin)
   - ✅ **Self-service**: Yes, via Stripe Customer Portal for plan upgrades/downgrades
   - ✅ **Webhooks**: Better Auth handles subscription lifecycle events automatically

---

This schema provides a solid foundation for building a comprehensive agency management platform with CRM, portfolio showcasing, and deal costing capabilities. All tables follow consistent patterns for soft deletion, audit trails, and multi-tenancy.
