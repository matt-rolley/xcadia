# Xcadia Schema Migration to Medusa v2

## Overview

This document outlines what from the original SCHEMA.md can be **kept**, what needs to **change**, and what can be **removed** now that Xcadia is using Medusa v2 as its backend.

### Understanding Xcadia's Core Use Case

Xcadia is a **multi-tenant SaaS platform** for agencies to showcase their work to potential clients:

#### Multi-Tenancy Model

- **Platform**: Xcadia (your SaaS product)
  - Multiple agencies sign up and use the platform
  - Each agency is a separate "team" with isolated data
  - Think: Like Notion, where multiple organizations use the same platform but can't see each other's data

- **Team (Agency)**: An agency using Xcadia
  - Example: "Digital Agency ABC", "Design Studio XYZ"
  - Has their own admin users, projects, portfolios, clients
  - Cannot see other teams' data (strict isolation)

#### Core Entities (Per Team)

1. **Project (Case Study)**: A showcase of completed work (e.g., "Website for Acme Corp")
   - Contains: Title, description, text content, images, videos, 3D models
   - Purpose: Show examples of your agency's work
   - Example: "E-commerce redesign for Fashion Brand X"
   - **Scoped to Team**: Each team has their own projects

2. **Portfolio (Curated Collection)**: A collection of projects sent to a specific contact
   - Contains: Multiple projects + custom branding
   - Purpose: "Here are 5 case studies relevant to your industry I want to show you"
   - Example: Send portfolio of 5 e-commerce projects to a retail company contact
   - **Scoped to Team**: Each team creates portfolios from their projects

3. **Contact**: A person at a company who receives portfolios
   - NOT a customer who buys things
   - NOT an authenticated user (initially)
   - Purpose: CRM contact who receives portfolio emails
   - **Scoped to Team**: Each team has their own contacts (private CRM)

4. **Company**: Client organization that employs contacts
   - Purpose: Group contacts by their organization
   - Track which projects were done for which companies
   - **Scoped to Team**: Each team has their own companies (private CRM)

#### Multi-Tenancy Requirements

**Critical**: All data MUST be scoped to teams:
- Team A cannot see Team B's projects, contacts, companies, or portfolios
- Each team has separate usage limits (storage, projects, emails)
- Each team has their own subscription/billing
- Admin users belong to teams (can't access other teams' data)

---

## Key Medusa v2 Concepts

### What Medusa Provides Out-of-the-Box

Medusa v2 includes these Commerce Modules that replace custom implementations:

- **Product Module**: Products, variants, categories, collections
- **Customer Module**: Customers, addresses, customer groups
- **Order Module**: Orders, order items, payments, shipping
- **User Module**: Admin users, authentication
- **Cart Module**: Shopping carts, line items
- **Payment Module**: Payment providers, payment sessions
- **Fulfillment Module**: Shipping providers, fulfillment
- **Inventory Module**: Stock levels, reservations
- **File Module**: File uploads and management
- **Region Module**: Regions, currencies, tax settings
- **Store Module**: Store settings and configuration

### How to Extend Medusa

1. **Custom Modules**: Create modules with custom data models (like your Brand, Company, Contact)
2. **Module Links**: Link custom data models to Medusa's commerce modules (maintains isolation)
3. **Workflows**: Build business logic in workflows (not in API routes!)
4. **Workflow Hooks**: Hook into existing workflows to add custom logic
5. **API Routes**: Thin controllers that call workflows - keep logic out of routes
6. **Subscribers**: React to events emitted by workflows and modules
7. **Scheduled Jobs**: Run periodic tasks (e.g., check subscription renewals)
8. **Admin UI**: Use Medusa Admin UI components and widgets for custom admin interfaces

**Critical Architecture Rules**:
- ✅ **DO**: Put business logic in workflows (with rollback support)
- ✅ **DO**: Make API routes thin - just validate input and call workflows
- ✅ **DO**: Use subscribers to react to events (email notifications, tracking, etc.)
- ✅ **DO**: Use the Notification Module for all emails (with Resend provider)
- ❌ **DON'T**: Put business logic directly in API routes
- ❌ **DON'T**: Use custom SMTP - use Medusa's Notification Module
- ❌ **DON'T**: Create separate admin interfaces - use Medusa UI only

**Important**: All custom admin UI code MUST use [Medusa UI](https://docs.medusajs.com/resources/references/medusa-ui) components to maintain consistency with the built-in admin dashboard.

---

## Database Schema Analysis

### ✅ KEEP (Implement as Custom Modules)

These concepts are **not provided by Medusa** and should be implemented as custom modules:

#### 1. **Team - Custom Module** ⭐ FOUNDATION
```typescript
// src/modules/team/models/team.ts
// src/modules/team/models/team-member.ts
```
- **What it is**: The billing entity and workspace for users
- **Why Keep**: Medusa doesn't have multi-tenant team/workspace concept
- **Implementation**: Create Team Module (FIRST module to implement)
- **Features**:
  - **Multi-ownership**: Multiple owners per team
  - **Multi-membership**: Users can belong to multiple teams
  - **Branding**: Team logo (File Module link)
  - **Roles**: Owner (billing + admin) and Member (no billing access)
  - **Invitations**: Email-based invites → account creation → team join
  - **Subscription**: Links to Medusa subscription (team subscribes, not user)
- **Data Models**:
  ```typescript
  Team {
    id: uuid
    name: string
    slug: string (unique, URL-friendly)
    logo_id: string (FK → File Module)
    subscription_id: string (FK → Medusa Order for subscription)
    created_at: timestamp
    updated_at: timestamp
  }

  TeamMember {
    id: uuid
    team_id: uuid (FK → Team)
    user_id: string (FK → Medusa User)
    role: enum ('owner' | 'member')
    invited_by: string (FK → Medusa User)
    joined_at: timestamp
  }
  ```
- **ALL other custom modules link to Team** via `team_id`

---

#### 2. **Company (CRM) - Custom Module**
```typescript
// src/modules/company/models/company.ts
```
- **Why Keep**: Medusa doesn't have a B2B CRM system
- **Implementation**: Create Company Module
- **Link to Medusa**: Link to Customer Module (a company can have multiple customer accounts)
- **Changes**:
  - **Keep `team_id`** → Links to Team custom module for multi-tenancy
  - Use Medusa's User Module instead of Better Auth
  - Leverage Medusa's File Module for logo storage
- **Scoping**: All companies scoped to team (private CRM per team)

#### 3. **Contact (CRM) - Custom Module**
```typescript
// src/modules/company/models/contact.ts
```
- **Why Keep**: Medusa's Customer is for authenticated users; Contact is for CRM contacts
- **Implementation**: Part of Company Module
- **Link to Medusa**: Link to Company (custom) and optionally Customer (Medusa)
- **Key Points**:
  - Contacts are **NOT** authenticated users (no login)
  - Receive portfolio emails via their email address
  - Click link → view public portfolio (no password required by default)
  - If contact signs up as user, they create their own team (separate workspace)
- **Changes**:
  - **Keep `team_id`** → Inherited from Company (contacts scoped to team)
  - Could optionally link a Contact to a Customer (when they sign up)

#### 4. **Project (Case Study) - Custom Module**
```typescript
// src/modules/portfolio/models/project.ts
```
- **What it is**: A case study showcasing completed work (e.g., "Website for Acme Corp")
- **Contains**: Text descriptions, images, videos, 3D models (GLB files)
- **Why Keep**: Case study showcase is not a Medusa feature - this is NOT a sellable product
- **Implementation**: Create Portfolio Module
- **Link to Medusa**:
  - Link to Company (custom) to show "work we did for this client"
  - Link to File (Medusa) for all media assets (images, videos, 3D models)
  - **NOT linked to Product** - projects are showcases, not products
- **Changes**:
  - Remove `folder_id` → Use direct links to Files via module links
  - **Keep `team_id`** → Links to Team custom module for multi-tenancy
  - Each project has multiple Files (images, videos, 3D) linked via module link
- **File Types**: Images, videos, 3D models (GLB format only)
- **File Organization**: Flat structure with metadata/tags (no folders)

#### 5. **Portfolio (Collection) - Custom Module**
```typescript
// src/modules/portfolio/models/portfolio.ts
```
- **What it is**: A curated collection of projects sent to a specific contact
- **Use case**: "Here are 5 case studies relevant to your industry that I want to show you"
- **Why Keep**: Portfolio curation and sending is custom functionality
- **Implementation**: Part of Portfolio Module
- **Link to Medusa**:
  - Link to Projects (custom) via many-to-many
  - Link to Contact (custom) - who is receiving this portfolio
  - Use File Module for portfolio branding (logo, custom assets)
- **Changes**:
  - **Keep `team_id`** → Links to Team custom module for multi-tenancy
  - Use Medusa's File Module for logo/media storage
  - Portfolio is tied to a Contact, not just a generic shareable link
- **Features**:
  - **Password Protection**: Optional password to access portfolio
  - **Expiry Date**: Optional expiration date for portfolio access

#### 6. **Deal/Tender System - Custom Module**
```typescript
// src/modules/deal/models/deal.ts
// src/modules/deal/models/deal-scenario.ts
// src/modules/deal/models/deal-line-item.ts
```
- **Why Keep**: Medusa doesn't provide quote/estimate functionality
- **Implementation**: Create Deal Module
- **Link to Medusa**:
  - Link to Company (custom)
  - Link to Customer (Medusa) if quote is for a customer
  - Link to Portfolio (custom)
  - Could link to Order (Medusa) when deal is won
- **Changes**:
  - **Keep `team_id`** → Links to Team custom module for multi-tenancy
  - Use Medusa's currency system (Region Module)

#### 7. **Email Templates - Custom Module**
```typescript
// src/modules/email/models/email-template.ts
```
- **Why Keep**: Medusa has notifications but not custom email templates
- **Implementation**: Create Email Module or extend Notification Module
- **Link to Medusa**: Use with custom workflows
- **Changes**:
  - **Keep `team_id`** → Links to Team custom module for multi-tenancy
  - Consider using Medusa's Notification Module + providers (Resend)

#### 8. **Portfolio Email Tracking - Custom Module**
```typescript
// src/modules/email/models/portfolio-email.ts
// src/modules/email/models/portfolio-view.ts
```
- **Why Keep**: Email tracking is custom functionality
- **Implementation**: Part of Email Module
- **Link to Medusa**: Link to Contact (custom), Customer (Medusa)
- **Changes**:
  - **Keep `team_id`** → Inherited from Portfolio (tracking scoped to team)
  - Track email opens, link clicks for portfolio engagement

---

### 🔄 REPLACE (Use Medusa Commerce Modules)

These should be **replaced with Medusa's built-in modules**:

#### 1. ❌ **File Table** → ✅ **Use Medusa File Module**
- **Medusa Provides**: Complete file management with upload, storage, metadata
- **Migration**:
  - Use Medusa's File Module API
  - Upload files via `/admin/uploads` and `/store/uploads`
  - Files are stored with S3-compatible providers (Tigris works!)
- **Links**:
  - Link files to Projects (custom module)
  - Link files to Portfolios (custom module)

#### 2. ❌ **Folder Table** → ✅ **Use Medusa File Module or Custom Tags**
- **Medusa Provides**: File organization via metadata
- **Migration Options**:
  1. Use file metadata/tags in File Module
  2. Create lightweight Folder custom module that links to Files
  3. Store folder hierarchy as JSON metadata
- **Recommendation**: Use metadata/tags unless deep hierarchy is critical

#### 3. ❌ **Better Auth User/Session/Account** → ✅ **Use Medusa User & Auth Modules**
- **Medusa Provides**:
  - User Module for admin users
  - Customer Module for storefront users
  - Built-in authentication (JWT)
  - Invite system for admin users
- **Migration**:
  - Admin users → Medusa User Module
  - Customers → Medusa Customer Module
  - Sessions → Medusa's JWT authentication
  - OAuth → Medusa Auth Module with providers

#### 4. ❌ **Better Auth Teams/Organizations** → ✅ **Use Medusa Store Module + Custom**
- **Medusa Provides**:
  - Store Module for multi-store setups
  - Could use Sales Channel Module for team isolation
- **Migration Options**:
  1. Each team = separate Medusa store instance
  2. Use Sales Channels to segment data by team
  3. Create custom Team module and link to all other entities
- **Recommendation**: Use Sales Channels or custom Team module linked to Store

#### 5. ❌ **Subscription Plan Tables** → ✅ **Use Medusa Product + Subscription**
- **Medusa Provides**:
  - Products can represent subscription plans
  - Pricing via Product variants
  - Can add subscription module/plugin
- **Migration**:
  - Subscription plans → Products with specific product type
  - Features → Product metadata
  - Pricing tiers → Product variants
  - Team subscription → Customer subscription to product
- **Keep Custom**: Usage tracking (storage, API calls, etc.) as custom module

---

### 🔀 HYBRID (Partial Medusa + Custom)

#### 1. **API Tokens** → Medusa API Key Module + Custom Tracking
- **Medusa Provides**: API key authentication
- **Keep Custom**: Token metadata, permissions, usage tracking
- **Implementation**:
  - Use Medusa's Publishable API Keys
  - Create custom module for token metadata and scoping
  - **Keep `team_id`** → Link to Team custom module for multi-tenancy

#### 2. **Subscription/Usage Tracking** → Custom Module + Medusa Events
- **Medusa Provides**: Event system for tracking actions
- **Keep Custom**: Usage counters, limits, enforcement
- **Implementation**:
  - **Keep `team_id`** → All usage tracked per team
  - Subscribe to Medusa events (file.uploaded, order.created, etc.)
  - Update usage counters in custom module
  - Enforce soft limits (warn at 80%, email for next month)
  - Track: storage_gb, project_count, portfolio_count, email_count, etc.

#### 3. **Audit Log** → Custom Module + Medusa Events
- **Medusa Provides**: Event bus for all entity changes
- **Keep Custom**: Audit log storage and querying
- **Implementation**:
  - **Keep `team_id`** → All audit logs scoped to team
  - Subscribe to Medusa events for all entity changes
  - Store in custom audit_log module
  - Includes both Medusa and custom module events

---

## Recommended New Architecture

### Module Structure

```
apps/medusa/src/
├── modules/
│   ├── team/                 # ⭐ FOUNDATION - Team/Multi-tenancy
│   │   ├── models/
│   │   │   ├── team.ts           # team_id, name, slug, logo_id, subscription_id
│   │   │   └── team-member.ts     # team_id, user_id, role (owner/member)
│   │   └── service.ts
│   │
│   ├── company/              # CRM - Companies & Contacts (has team_id)
│   │   ├── models/
│   │   │   ├── company.ts         # team_id, name, logo, etc.
│   │   │   └── contact.ts         # team_id (via company), email, etc.
│   │   └── service.ts
│   │
│   ├── portfolio/            # Portfolio & Projects (has team_id)
│   │   ├── models/
│   │   │   ├── project.ts         # team_id, name, description, files
│   │   │   ├── portfolio.ts       # team_id, name, password, expiry_date
│   │   │   ├── portfolio-project.ts
│   │   │   └── portfolio-file.ts
│   │   └── service.ts
│   │
│   ├── deal/                 # Deal/Quote System (has team_id)
│   │   ├── models/
│   │   │   ├── deal.ts            # team_id, company_id, etc.
│   │   │   ├── deal-scenario.ts
│   │   │   ├── deal-line-item.ts
│   │   │   └── deal-template.ts
│   │   └── service.ts
│   │
│   ├── email/                # Email & Tracking (has team_id)
│   │   ├── models/
│   │   │   ├── email-template.ts  # team_id, template content
│   │   │   ├── portfolio-email.ts # team_id (via portfolio), sent_at
│   │   │   └── portfolio-view.ts  # team_id (via portfolio), viewed_at
│   │   └── service.ts
│   │
│   └── usage/                # Usage Tracking & Limits (has team_id)
│       ├── models/
│       │   ├── usage-tracker.ts   # team_id, storage_gb, project_count, etc.
│       │   └── api-token-metadata.ts
│       └── service.ts
│
├── links/                    # Module Links
│   ├── team-user.ts          # Team → User (Medusa, via TeamMember)
│   ├── team-file.ts          # Team → File (Medusa, for team logo)
│   ├── team-order.ts         # Team → Order (Medusa, for subscription)
│   ├── company-team.ts       # Company → Team (custom, all companies scoped to team)
│   ├── company-customer.ts   # Company → Customer (Medusa, optional)
│   ├── contact-customer.ts   # Contact → Customer (Medusa, optional if they sign up)
│   ├── contact-company.ts    # Contact → Company (custom, primary relationship)
│   ├── project-team.ts       # Project → Team (custom, all projects scoped to team)
│   ├── project-company.ts    # Project → Company (which client was this for?)
│   ├── project-file.ts       # Project → File (Medusa, images/videos/3D models)
│   ├── portfolio-team.ts     # Portfolio → Team (custom, all portfolios scoped to team)
│   ├── portfolio-contact.ts  # Portfolio → Contact (who is receiving this?)
│   ├── portfolio-project.ts  # Portfolio → Project (custom, M2M)
│   ├── portfolio-file.ts     # Portfolio → File (Medusa, branding assets)
│   ├── deal-team.ts          # Deal → Team (custom, all deals scoped to team)
│   ├── deal-company.ts       # Deal → Company (custom)
│   ├── deal-contact.ts       # Deal → Contact (custom, specific person)
│   └── deal-portfolio.ts     # Deal → Portfolio (we sent them this showcase)
│
├── workflows/                # Custom Workflows
│   ├── create-project.ts
│   ├── send-portfolio.ts
│   ├── create-deal.ts
│   └── track-usage.ts
│
├── api/
│   ├── admin/                # Admin API Routes
│   │   ├── companies/
│   │   ├── projects/
│   │   ├── portfolios/
│   │   └── deals/
│   └── store/                # Storefront API Routes
│       └── portfolios/       # Public portfolio viewer
│
└── admin/                    # Admin UI Customizations
    ├── widgets/              # Custom widgets using Medusa UI
    ├── routes/               # Custom admin pages using Medusa UI
    └── components/           # Reusable UI components (Medusa UI only)
```

**Note**: All admin UI must use [Medusa UI](https://docs.medusajs.com/resources/references/medusa-ui) components for consistency.

---

## Migration Strategy

**Important**:
1. **Commit after each phase** - Clean checkpoints to roll back if needed
2. **Review with Medusa expert** - After each phase, spawn a Medusa expert agent to review the implementation and ensure it follows Medusa v2 best practices

### Phase 0: Foundation Setup
**Goal**: Set up Medusa with proper configuration

1. ✅ Configure Medusa with PostgreSQL (Neon)
2. ✅ Set up File Module with Tigris/S3 storage
3. Set up Email/Notification providers (Resend)
4. Create subscription Products (Free, Pro - Monthly/Yearly variants)

**✅ Commit**: `git commit -m "feat: phase 0 - foundation setup complete"`

**🔍 Review**: Spawn Medusa expert agent to verify:
- PostgreSQL connection is properly configured
- File Module is using correct S3/Tigris setup
- Resend provider is correctly integrated
- Subscription Products follow Medusa conventions

### Phase 1: Team/Multi-tenancy ⭐ FOUNDATION
**Goal**: Implement Custom Team Module for multi-tenant SaaS

**Implementation Steps**:
1. **Create Team Module**:
   ```typescript
   // src/modules/team/models/team.ts
   model.define("team", {
     id: model.id().primaryKey(),
     name: model.text(),
     slug: model.text().unique(), // URL-friendly identifier
     created_at: model.dateTime(),
     updated_at: model.dateTime()
   })

   // src/modules/team/models/team-member.ts
   model.define("team_member", {
     id: model.id().primaryKey(),
     role: model.enum(["owner", "member"]),
     invited_by: model.text(), // user_id who sent invite
     joined_at: model.dateTime()
   })
   ```

2. **Create Module Links**:
   - `team-user.ts` → Link Team to Medusa User (via TeamMember)
   - `team-file.ts` → Link Team to Medusa File (for team logo)
   - `team-order.ts` → Link Team to Medusa Order (for subscription)

3. **Create Team Workflows** (business logic):
   ```typescript
   // src/workflows/team/create-team.ts
   - createTeamWorkflow: Create team + add creator as owner

   // src/workflows/team/invite-member.ts
   - inviteMemberWorkflow: Send invite email + create pending invitation

   // src/workflows/team/accept-invitation.ts
   - acceptInvitationWorkflow: Add user to team + send welcome email

   // src/workflows/team/remove-member.ts
   - removeMemberWorkflow: Remove from team + cleanup permissions
   ```

4. **Create Subscribers** (react to events):
   ```typescript
   // src/subscribers/team-member-invited.ts
   - Listen: team.member_invited
   - Action: Send invitation email via Notification Module

   // src/subscribers/team-member-joined.ts
   - Listen: team.member_joined
   - Action: Send welcome email, notify team owners
   ```

5. **Build Admin API Routes** (thin controllers):
   ```typescript
   // Routes just validate input and call workflows
   POST /admin/teams → calls createTeamWorkflow
   GET /admin/teams → calls teamModuleService.listTeams()
   GET /admin/teams/:id → calls teamModuleService.retrieveTeam()
   PATCH /admin/teams/:id → calls updateTeamWorkflow
   POST /admin/teams/:id/members → calls inviteMemberWorkflow
   DELETE /admin/teams/:id/members/:user_id → calls removeMemberWorkflow
   ```

6. **Create Middleware**:
   - Extract team context from request (header, JWT, session)
   - Inject `team_id` into all queries automatically
   - Enforce team isolation (prevent cross-team data access)

7. **Build Admin UI** (using Medusa UI components):
   - Team management page with list and detail views
   - Team member management interface
   - Team settings page

8. **Team Switching UX**:
   - Dropdown in navbar to select active team (use Medusa UI Select component)
   - Store active team in session/local storage
   - Pass team context in all API requests

**✅ Commit**: `git commit -m "feat: phase 1 - team module and multi-tenancy foundation"`

**Test Before Moving On**:
- Create a team via API
- Add members to team
- Switch between teams
- Verify team isolation in queries

**🔍 Review**: Spawn Medusa expert agent to verify:
- Data models use correct Medusa DML syntax
- Module service extends MedusaService correctly
- Module links are properly defined with defineLink
- Module is correctly registered in medusa-config.ts
- Migrations are generated and run correctly
- **Workflows contain business logic** (not in API routes)
- **API routes are thin** - just validate and call workflows
- **Subscribers properly listen to events** and use Notification Module
- **Workflows use createStep and createWorkflow** from @medusajs/framework/workflows-sdk
- **Workflows have proper rollback** for each step
- Middleware properly uses Medusa container
- Admin UI uses only Medusa UI components
- Team isolation is implemented the Medusa way (not hacky workarounds)

### Phase 2: CRM Foundation (Company + Contact)
**Goal**: Build mini-CRM using custom modules

1. Create Company Module with data models (include `team_id`)
2. Create Contact data model in Company Module (include `team_id` via company)
3. Link Company to Team (custom) - REQUIRED for isolation
4. Link Company to Customer Module (Medusa) - optional
5. Link Contact to Customer Module (optional)
6. Build admin API routes for CRUD (with team context middleware)
7. Generate and run migrations
8. Build admin UI (using Medusa UI components - Tables, Forms, Cards, etc.)

**✅ Commit**: `git commit -m "feat: phase 2 - company and contact CRM module"`

**Test Before Moving On**:
- Create companies scoped to team
- Add contacts to companies
- Verify team isolation (can't see other team's companies)
- Test admin UI for CRUD operations

**🔍 Review**: Spawn Medusa expert agent to verify:
- Company module follows Medusa module structure
- Multiple data models in same module are properly organized
- Module links between Company/Contact and Team are correct
- Service methods use proper MedusaService patterns
- API routes use team context middleware correctly
- Queries properly filter by team_id
- Admin UI components use Medusa UI (Tables, Forms, Cards)

### Phase 3: Portfolio System
**Goal**: Create portfolio showcase using custom modules + Medusa File Module

1. Create Portfolio Module with Project + Portfolio models (include `team_id` on both)
2. Link Project to Team (custom) - REQUIRED for isolation
3. Link Project to Company (custom) - optional, to show client work
4. Link Project to File (Medusa) - for images, videos, 3D models (GLB)
5. Link Portfolio to Team (custom) - REQUIRED for isolation
6. Link Portfolio to File (Medusa) - for branding assets
7. Create many-to-many link for Portfolio ↔ Project
8. Add portfolio features: password protection, expiry date
9. Build workflows for project creation (auto-creates file associations)
10. Build admin API routes (with team context middleware)
11. Build public portfolio viewer API route (validates password/expiry)
12. Build admin UI (using Medusa UI components - Tables, Forms, Modals, File Upload, etc.)

**✅ Commit**: `git commit -m "feat: phase 3 - portfolio and project showcase module"`

**Test Before Moving On**:
- Create projects with file uploads (images, videos, GLB)
- Create portfolios with multiple projects
- Test password protection and expiry dates
- View public portfolio (non-authenticated)
- Verify team isolation

**🔍 Review**: Spawn Medusa expert agent to verify:
- Portfolio module structure is Medusa-native
- File uploads use Medusa File Module correctly (not custom implementation)
- Module links to File Module follow Medusa patterns
- Many-to-many Portfolio ↔ Project link is properly defined
- Workflows for project creation use Medusa workflow system
- Password hashing follows security best practices
- Public API route (store) is separate from admin routes
- File upload UI uses Medusa UI components

### Phase 4: Email & Tracking
**Goal**: Email sending and engagement tracking

1. Set up Medusa Notification Module with Resend provider
2. Create Email Module for templates and tracking (include `team_id`)
3. Link EmailTemplate to Team (custom) - REQUIRED for isolation
4. Link PortfolioEmail to Portfolio (inherits `team_id`)
5. Link PortfolioEmail to Contact (custom) and Customer (Medusa)
6. Build workflow for sending portfolios with tracking
7. Build tracking endpoints (pixel, link redirect)
8. Subscribe to email events for analytics
9. Build analytics dashboard (team-scoped, using Medusa UI Charts and Metrics components)

**✅ Commit**: `git commit -m "feat: phase 4 - email and tracking module"`

**Test Before Moving On**:
- Send portfolio email to contact
- Track email opens (pixel tracking)
- Track link clicks
- View analytics dashboard
- Verify tracking is scoped to team

**🔍 Review**: Spawn Medusa expert agent to verify:
- Notification Module integration uses Medusa patterns (not custom SMTP)
- Resend provider is properly configured
- Email workflows use Medusa workflow system with rollback
- Event subscribers properly use Medusa Event Bus
- Tracking endpoints follow Medusa API route conventions
- Analytics use proper Query patterns to fetch cross-module data
- Dashboard uses Medusa UI Charts/Metrics components

### Phase 5: Deal/Quote System
**Goal**: Cost estimation and quoting

1. Create Deal Module with all models (include `team_id`)
2. Link Deal to Team (custom) - REQUIRED for isolation
3. Link Deal to Company (custom)
4. Link Deal to Customer (Medusa) - optional
5. Link Deal to Portfolio (custom)
6. Link Deal to Order (Medusa) when won
7. Build deal calculation workflows
8. Build admin API routes (with team context middleware)
9. Build admin UI with scenarios/line items (using Medusa UI Tables and Forms)

**✅ Commit**: `git commit -m "feat: phase 5 - deal and quote system"`

**Test Before Moving On**:
- Create deals with scenarios
- Add line items to scenarios
- Calculate totals with currency
- Link deals to portfolios and companies
- Test deal workflows
- Verify team isolation

**🔍 Review**: Spawn Medusa expert agent to verify:
- Deal module follows Medusa patterns for complex data models
- Currency calculations use Medusa Region Module
- Deal workflows use Medusa workflow system
- Module links to Company, Portfolio, Order are correct
- Calculation logic is in workflows (not in API routes)
- Admin UI uses Medusa UI Tables and Forms correctly

### Phase 6: Usage & Subscription
**Goal**: Subscription plans and usage tracking

**Implementation** (Using Medusa Products + Subscription Recipe):
1. Create subscription Products:
   - Free (Monthly) - usage limits in metadata
   - Pro (Monthly) - higher limits in metadata
   - Pro (Yearly) - highest limits, discounted price
2. Follow subscription recipe: https://docs.medusajs.com/resources/recipes/subscriptions
3. Link Team to Order (Medusa) for subscription tracking
4. Create Usage Tracker custom module (include `team_id`)
5. Link UsageTracker to Team (custom) - REQUIRED for isolation
6. Subscribe to Medusa events:
   - `file.created` → increment storage_gb
   - `project.created` → increment project_count
   - `portfolio_email.sent` → increment email_count
7. Build middleware to check limits (soft limits):
   - Warn at 80% usage
   - Send email warning for next billing cycle
   - Allow temporary overage (don't hard block)
8. Build usage dashboard (team-scoped, using Medusa UI Progress, Badges, and Metrics)
9. Build billing management UI (owners only, using Medusa UI Forms and Cards)

**✅ Commit**: `git commit -m "feat: phase 6 - usage tracking and subscription system"`

**Test Before Moving On**:
- Subscribe team to Free plan
- Upload files and verify usage tracking
- Create projects and verify counters
- Test soft limits (warnings at 80%)
- Upgrade to Pro plan
- Verify owners-only billing access
- Test usage dashboard

**🔍 Review**: Spawn Medusa expert agent to verify:
- Subscription implementation follows official Medusa recipe
- Products for subscriptions use correct metadata structure
- Usage tracking uses Medusa Event Bus (not custom events)
- Event subscribers properly increment counters
- Middleware for limit checks doesn't break Medusa patterns
- Team → Order link for subscriptions is correct
- Billing UI properly checks user roles (owners only)
- Usage dashboard uses Medusa UI Progress, Badges, Metrics

**🎉 Final Commit**: `git commit -m "feat: xcadia medusa v2 migration complete"`

**🔍 Final Review**: Spawn Medusa expert agent for comprehensive review:
- Overall architecture follows Medusa v2 best practices
- All modules maintain proper isolation
- Module links are correctly defined throughout
- No direct foreign keys between modules (only via links)
- All custom code uses Medusa conventions
- Admin UI exclusively uses Medusa UI components
- Workflows properly use Medusa workflow system
- Event handling uses Medusa Event Bus
- No hacky workarounds or anti-patterns
- Performance: proper use of Query for cross-module data
- Security: team isolation is properly enforced everywhere

---

## Key Differences from Original Schema

### What's Better with Medusa

1. **File Management**: No need to build file upload/storage from scratch
2. **User Authentication**: Built-in JWT auth, no need for Better Auth
3. **API Infrastructure**: RESTful API routes auto-generated, OpenAPI docs
4. **Event System**: Built-in event bus for real-time updates
5. **Admin UI**: Extensible admin panel with widgets
6. **Migrations**: Auto-generated migrations from data models
7. **Type Safety**: Full TypeScript support with generated types
8. **Module Isolation**: Clean separation of concerns
9. **Workflow System**: Built-in workflow engine with rollback
10. **Multi-region**: Built-in support for regions, currencies, taxes

### What Requires More Work

1. **Multi-tenancy**: Need to implement Custom Team Module with middleware for isolation
2. **CRM Features**: All CRM (Company/Contact) is custom
3. **Portfolio System**: All portfolio features are custom
4. **Deal/Quote System**: All costing features are custom
5. **Email Tracking**: Custom implementation (but can use Notification Module base)
6. **Usage Tracking**: Custom implementation (but can use Event System)

---

## Technical Decisions Needed

### 1. ~~Multi-tenancy Strategy~~
**RESOLVED**: Custom Team Module

**Decision**: **C) Custom Team Module** - Full control, explicit relationships

**Why Custom Team Module**:
- Team = Billing entity (subscribes to subscription plans)
- Team has multiple owners (solves ownership transfer problem)
- Users can belong to multiple teams (like Slack workspaces)
- Team members collaborate in shared workspace
- Complete data isolation between teams

**Team Features**:
- **Branding**: Team logo
- **Roles**: Owner (billing + full control) and Member (everything except billing)
- **Multi-owner**: Multiple owners per team allowed
- **Invitations**: Invite by email → user creates account → joins team
- **Team Switching**: Dropdown in navbar to switch between teams (UX TBD)

---

### 2. Customer vs Contact Distinction
**Question**: Should CRM Contacts be linked to Medusa Customers?

**Options**:
- A) Contacts are completely separate (no link to Customer)
- B) Contact can optionally be linked to Customer (when they sign up)
- C) Contact and Customer are the same (merge concepts)

**Recommendation**: **B) Optional link** - Flexibility for future client portals

---

### 3. ~~Folder Hierarchy~~
**RESOLVED**: Flat structure with metadata/tags

**Decision**: **A) Use Medusa File Module metadata/tags only**

- No folder hierarchy needed
- Files organized via metadata and tags
- Simpler implementation
- Sufficient for project file management

---

### 4. ~~Subscription Billing~~
**RESOLVED**: Medusa Products + Subscription Recipe

**Decision**: **A) Medusa Products + Subscription Recipe** - Following official Medusa pattern

**Implementation**:
- Follow: https://docs.medusajs.com/resources/recipes/subscriptions
- Subscription plans = Medusa Products with specific product type
- **Plans**: Free and Pro (for now)
- **Billing cycles**: Monthly and Yearly variants
- Team subscribes (not individual users)
- Owners manage billing

**Usage Limits (stored in Product metadata)**:
- Storage GB per team
- Max projects per team
- Max portfolios per team
- Max companies per team
- Max contacts per team
- Max email sends per month
- Max file upload size

**Enforcement**: Soft limits
- Warn when approaching limit (e.g., at 80%)
- Send email warning for next month
- Don't hard block (allow overage temporarily)

---

### 5. ~~Projects as Products?~~
**RESOLVED**: Projects are **NOT** products. They are case studies/showcases.

- Projects are portfolio pieces showing completed work
- They contain media files but are not sellable items
- No link to Medusa Product Module needed
- If you later want to sell services based on projects, create Products separately

---

## Summary Table

| Original Table | Action | Medusa Replacement | Custom Module | Notes |
|---------------|--------|-------------------|---------------|-------|
| `user` | ❌ Replace | User Module | - | Admin users |
| `session` | ❌ Replace | Auth Module | - | JWT auth |
| `account` | ❌ Replace | Auth Module | - | OAuth providers |
| `team` | 🔄 Hybrid | Sales Channel / Store | Team Module (optional) | Multi-tenancy |
| `member` | 🔄 Hybrid | Sales Channel permissions | Team Module | - |
| `invitation` | ❌ Replace | User Module invites | - | Admin invites |
| `file` | ❌ Replace | File Module | - | S3-compatible |
| `folder` | 🔄 Hybrid | File metadata | Folder Module (optional) | Depends on needs |
| `company` | ✅ Keep | - | Company Module | CRM |
| `contact` | ✅ Keep | - | Company Module | CRM |
| `project` | ✅ Keep | - | Portfolio Module | Showcase |
| `portfolio` | ✅ Keep | - | Portfolio Module | Showcase |
| `portfolio_project` | ✅ Keep | - | Module Link | M2M |
| `portfolio_file` | ✅ Keep | - | Module Link | Links to File Module |
| `portfolio_folder` | ❓ Maybe | - | Module Link | If keeping folders |
| `portfolio_email` | ✅ Keep | - | Email Module | Tracking |
| `portfolio_view` | ✅ Keep | - | Email Module | Analytics |
| `email_template` | ✅ Keep | - | Email Module | Templates |
| `deal` | ✅ Keep | - | Deal Module | Quotes |
| `deal_scenario` | ✅ Keep | - | Deal Module | Pricing |
| `deal_line_item` | ✅ Keep | - | Deal Module | Breakdown |
| `deal_template` | ✅ Keep | - | Deal Module | Reusable |
| `subscription_plan` | 🔄 Hybrid | Product Module | Usage Module | Plans as products |
| `team_subscription` | 🔄 Hybrid | Order/Subscription | Usage Module | Usage tracking |
| `api_token` | 🔄 Hybrid | API Key Module | Usage Module | Metadata |
| `audit_log` | ✅ Keep | Event Bus | Audit Module | Event subscriber |

**Legend**:
- ✅ Keep = Implement as custom module
- ❌ Replace = Use Medusa commerce module
- 🔄 Hybrid = Combination of Medusa + custom
- ❓ Maybe = Depends on requirements

---

## Admin UI Development Guidelines

### Medusa UI Requirements

**Critical**: All custom admin interfaces MUST use [Medusa UI](https://docs.medusajs.com/resources/references/medusa-ui) components.

### Why Medusa UI?

1. **Consistency**: Matches the built-in Medusa admin dashboard design
2. **Maintenance**: Automatic updates with Medusa version upgrades
3. **Accessibility**: Built-in ARIA labels and keyboard navigation
4. **Theme Support**: Respects user's dark/light mode preferences
5. **Mobile Responsive**: Works on all screen sizes out of the box

### Key Medusa UI Components to Use

**Layout & Structure**:
- `Container`, `Heading`, `Text` - Page structure
- `Table` - Data tables with sorting, filtering, pagination
- `Tabs` - Tabbed interfaces

**Forms & Inputs**:
- `Input`, `Textarea`, `Select` - Form fields
- `Checkbox`, `RadioGroup`, `Switch` - Selection controls
- `DatePicker` - Date selection
- `Label` - Form labels

**Actions & Feedback**:
- `Button` - Primary, secondary, danger actions
- `IconButton` - Icon-only buttons
- `Toast` - Success/error notifications
- `Modal`, `Drawer` - Overlays and side panels
- `DropdownMenu` - Action menus

**Data Display**:
- `Badge` - Status indicators
- `Card` - Content containers
- `Progress` - Progress bars and indicators
- `Tooltip` - Contextual help

**File Handling**:
- File upload components for media management

### Example: Custom Admin Page

```tsx
// src/admin/routes/teams/page.tsx
import { Container, Heading, Table, Button } from "@medusajs/ui"

export default function TeamsPage() {
  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <Heading level="h1">Teams</Heading>
        <Button>Create Team</Button>
      </div>

      <Table>
        {/* Team list using Medusa UI Table component */}
      </Table>
    </Container>
  )
}
```

### Admin UI Structure

```
src/admin/
├── routes/                    # Custom admin pages
│   ├── teams/
│   │   ├── page.tsx          # Team list page (using Medusa UI)
│   │   └── [id]/
│   │       └── page.tsx      # Team detail page (using Medusa UI)
│   ├── companies/
│   ├── projects/
│   └── portfolios/
│
├── widgets/                   # Dashboard widgets
│   ├── usage-stats.tsx       # Usage metrics widget (Medusa UI Charts)
│   └── recent-portfolios.tsx # Recent activity (Medusa UI Cards)
│
└── components/                # Reusable components (all using Medusa UI)
    ├── team-selector.tsx     # Team dropdown (Medusa UI Select)
    ├── project-form.tsx      # Project form (Medusa UI Form components)
    └── file-uploader.tsx     # Media uploader (Medusa UI File components)
```

### Resources

- [Medusa UI Documentation](https://docs.medusajs.com/resources/references/medusa-ui)
- [Admin UI Customization Guide](https://docs.medusajs.com/learn/customization/customize-admin)
- [Admin Widgets](https://docs.medusajs.com/learn/customization/customize-admin/widget)
- [Admin Routes](https://docs.medusajs.com/learn/customization/customize-admin/route)

---

## Third-Party Integrations & Analytics

### Phase 7: Integrations & Analytics (Future)
**Goal**: Connect Xcadia with external services for authentication, automation, and analytics

#### Authentication Providers
1. **Google OAuth Integration**
   - Follow official guide: https://docs.medusajs.com/resources/commerce-modules/auth/auth-providers/google
   - Allow users to sign up/login with Google accounts
   - Simplifies onboarding flow for new teams
   - Implementation:
     - Install Google auth provider module
     - Configure OAuth credentials in environment variables
     - Add Google sign-in button to login/signup UI
     - Link Google accounts to existing Team Members

#### Analytics & Tracking
2. **Analytics Platform Integration** (Choose one or multiple):
   - **Segment**: Universal data pipeline for all analytics tools
     - Track user actions, portfolio sends, conversions
     - Route data to multiple analytics platforms
     - Server-side tracking for accurate metrics
   - **PostHog**: Product analytics and feature flags
     - Session replays for debugging user issues
     - Feature flags for gradual rollouts
     - Funnel analysis for conversion optimization
   - **Google Analytics 4**: Standard web analytics
     - Page views, user flows, bounce rates
     - Integration with Google Ads for marketing
   - **Google Tag Manager**: Tag management for marketing pixels
     - Manage tracking scripts without code deploys
     - Facebook Pixel, LinkedIn Insight Tag, etc.

   **Implementation Approach**:
   - Create Analytics Module with configurable providers
   - Track key events via Medusa Event Bus subscribers:
     - User signup / team creation
     - Project created / published
     - Portfolio sent / opened / clicked
     - Deal created / quote sent / deal won
     - Subscription started / upgraded / cancelled
   - Server-side tracking for accuracy (immune to ad blockers)
   - Client-side tracking for web analytics (page views, sessions)

#### Automation & Webhooks
3. **Zapier Integration**
   - Expose webhook endpoints for Zapier triggers:
     - Portfolio sent → Trigger Zapier automation
     - Deal won → Create invoice in accounting software
     - New contact → Add to CRM (HubSpot, Salesforce)
     - Email opened → Notify in Slack
   - Implementation:
     - Create public webhook API routes (with authentication)
     - Document webhook payloads for Zapier configuration
     - Use Medusa Event Bus to emit events to webhooks
     - Support multiple webhook URLs per team (for different automations)
   - Example use cases:
     - Portfolio sent → Add contact to Mailchimp list
     - Deal won → Create project in Asana
     - New team member → Send Slack notification

#### Technical Implementation Notes
- **Analytics Events**: Use Medusa Event Bus subscribers to track events
- **Server-side Tracking**: More accurate than client-side (ad blockers, privacy)
- **Privacy Compliance**: Respect GDPR/CCPA - allow users to opt-out
- **Team-scoped**: Each team can configure their own integrations
- **Async Processing**: Don't block workflows waiting for analytics/webhooks
- **Error Handling**: Failed analytics/webhook calls shouldn't break core functionality
- **Security**: Webhook secrets, OAuth tokens stored securely in database

**✅ Commit**: `git commit -m "feat: phase 7 - integrations and analytics"`

**Resources**:
- [Google Auth Provider Guide](https://docs.medusajs.com/resources/commerce-modules/auth/auth-providers/google)
- [Medusa Event Bus](https://docs.medusajs.com/learn/fundamentals/events-and-subscribers)
- [Segment Documentation](https://segment.com/docs/)
- [PostHog Documentation](https://posthog.com/docs)
- [Zapier Webhooks Guide](https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks)

### Phase 8: CSV Import & Custom Email Domains
**Goal**: Enable easy data migration via CSV imports and custom domain email sending

#### CSV Import System
1. **Import Module** (team-scoped background job processing)
   - Create ImportJob model:
     - `team_id` - for multi-tenancy isolation
     - `entity_type` - enum: "company", "contact", "deal"
     - `status` - enum: "pending", "processing", "completed", "failed"
     - `file_url` - uploaded CSV file (via Medusa File Module)
     - `total_rows` - count from CSV
     - `processed_rows` - progress counter
     - `created_count` - successful creates
     - `updated_count` - successful updates
     - `skipped_count` - duplicates/errors
     - `error_log` - JSON array of errors with row numbers
     - `started_at`, `completed_at` - timestamps
     - `metadata` - import settings (duplicate handling, etc.)

2. **Import Workflows** (background processing with Medusa workflows)
   - `import-companies-workflow.ts`:
     - Parse CSV file
     - Validate rows (required fields)
     - Create companies in batches (100 at a time)
     - Update ImportJob progress after each batch
     - Handle duplicates (check by name + team_id)

   - `import-contacts-workflow.ts`:
     - Parse CSV file
     - Validate emails, required fields
     - Auto-create companies if company name doesn't exist
     - Create contacts in batches
     - Update ImportJob progress
     - Handle duplicates (check by email + team_id)

   - `import-deals-workflow.ts`:
     - Parse CSV file with deal data
     - Link to existing companies (by name match)
     - Create deals with scenarios/line items
     - Update ImportJob progress
     - Handle duplicates (check by name + company + team_id)

3. **API Routes**
   - `POST /admin/import/companies` - Upload CSV, create ImportJob, trigger workflow
   - `POST /admin/import/contacts` - Upload CSV, create ImportJob, trigger workflow
   - `POST /admin/import/deals` - Upload CSV, create ImportJob, trigger workflow
   - `GET /admin/import/jobs` - List all import jobs for team (paginated)
   - `GET /admin/import/jobs/:id` - Get import job status and results
   - `DELETE /admin/import/jobs/:id` - Cancel/delete import job

4. **CSV Format Requirements** (documented for frontend)
   - **Companies CSV**: `name,industry,website,notes`
   - **Contacts CSV**: `first_name,last_name,email,phone,job_title,company_name,notes`
   - **Deals CSV**: `name,company_name,deal_type,stage,description,amount,currency`
   - Frontend handles column mapping before sending to API
   - Backend expects columns in exact format above

5. **Background Processing**
   - Use Medusa workflows for async processing (don't block HTTP request)
   - Send notification email when import completes:
     - Success: "Import completed: 50 created, 10 updated, 5 skipped"
     - Failure: "Import failed: [error message]" with downloadable error log
   - Use Notification Module with IMPORT_COMPLETE template

#### Custom Email Domains (Resend Integration)
1. **Team Email Settings Model**
   - Add fields to Team model or create TeamEmailSettings model:
     - `custom_domain` - e.g., "agency.com" (nullable)
     - `domain_verified` - boolean (Resend verification status)
     - `from_email` - e.g., "portfolios@agency.com" or null for default
     - `from_name` - e.g., "Agency Name" (for email display name)
     - `sender_mode` - enum: "team" (use from_email) or "user" (use sender's email)
     - `dns_records` - JSON (SPF, DKIM, DMARC records from Resend)
     - `verified_at` - timestamp when domain was verified

2. **Domain Management Workflows**
   - `add-custom-domain-workflow.ts`:
     - Call Resend API to add domain
     - Store DNS records needed for verification
     - Set domain_verified = false
     - Return DNS records to user for setup

   - `verify-domain-workflow.ts`:
     - Call Resend API to check verification status
     - Update domain_verified status
     - Send notification email if verified

   - `remove-domain-workflow.ts`:
     - Remove domain from Resend
     - Reset team email settings to default

3. **API Routes**
   - `POST /admin/team/email/domain` - Add custom domain, get DNS records
   - `POST /admin/team/email/domain/verify` - Check verification status
   - `DELETE /admin/team/email/domain` - Remove custom domain
   - `PATCH /admin/team/email/settings` - Update from_email, from_name, sender_mode
   - `GET /admin/team/email/settings` - Get current email settings

4. **Update Resend Service**
   - Modify `send()` method to use team's custom domain:
     - Check if team has verified custom domain
     - If sender_mode = "team": use team's from_email
     - If sender_mode = "user": use sending user's email (if on verified domain)
     - Fallback: use default RESEND_FROM_EMAIL from env
   - Pass team context through notification.data
   - Validate sender email is on verified domain

5. **DNS Setup UI** (Admin Dashboard using Medusa UI)
   - Display DNS records with copy buttons
   - Show verification status (pending/verified)
   - Refresh button to check verification
   - Instructions for adding DNS records to domain registrar
   - Initial implementation in Medusa Admin, migrate to frontend later

6. **Subscription Add-on** (Future: Phase 6 integration)
   - Add "Custom Domain" as product variant or feature flag
   - Check subscription tier before allowing domain setup
   - Middleware to enforce custom domain limits

#### Technical Implementation Notes
- **CSV Processing**: Use streaming for large files (don't load entire CSV into memory)
- **Batch Processing**: Process imports in batches (100-500 rows) to avoid timeouts
- **Error Handling**: Store detailed error logs with row numbers for user review
- **Duplicate Detection**: Check by unique fields + team_id (name, email, etc.)
- **Progress Tracking**: Use ImportJob model to track progress, show in UI
- **Email Notifications**: Send via Notification Module when imports complete
- **Domain Verification**: Poll Resend API to check DNS propagation (can take 24-48 hours)
- **Sender Authentication**: Validate sender email against verified domains
- **Security**: Only team members can manage domains and imports (team isolation)

#### CSV Import Examples

**companies.csv**:
```csv
name,industry,website,notes
Acme Corp,Technology,https://acme.com,Potential client
Fashion Brand X,Retail,https://fashionx.com,Past client
```

**contacts.csv**:
```csv
first_name,last_name,email,phone,job_title,company_name,notes
John,Doe,john@acme.com,555-0100,CTO,Acme Corp,Met at conference
Jane,Smith,jane@fashionx.com,555-0200,Marketing Director,Fashion Brand X,Referred by Sarah
```

**deals.csv**:
```csv
name,company_name,deal_type,stage,description,amount,currency
Website Redesign,Acme Corp,project,proposal,Full site redesign,50000,USD
Marketing Campaign,Fashion Brand X,retainer,negotiation,6-month retainer,30000,USD
```

**✅ Commit**: `git commit -m "feat: phase 8 - csv import and custom email domains"`

**Test Before Moving On**:
- Upload companies CSV and verify background processing
- Upload contacts CSV with auto-company creation
- Check import job status and progress updates
- Verify email notification on import completion
- Add custom domain and get DNS records
- Verify domain after DNS setup
- Send portfolio email from custom domain
- Test sender_mode toggle (team vs user email)

**Resources**:
- [Resend Domain API](https://resend.com/docs/api-reference/domains)
- [Medusa File Module](https://docs.medusajs.com/resources/commerce-modules/file)
- [Medusa Workflows](https://docs.medusajs.com/learn/fundamentals/workflows)
- [CSV Parsing (Bun)](https://bun.sh/docs/api/file-io#reading-files)

---

## Next Steps

1. ✅ **Review this document** - Confirmed all technical decisions
2. ✅ **Multi-tenancy strategy chosen** - Custom Team Module
3. ✅ **Phase 1 Complete** - Team Module foundation implemented
4. ✅ **Phase 2 Complete** - CRM Foundation (Company + Contact)
5. ✅ **Phase 3 Complete** - Portfolio System
6. ✅ **Phase 4 Complete** - Email & Tracking System
7. **Continue with Phase 5** - Deal/Quote System
8. **Then Phase 6** - Usage & Subscription
9. **Future: Phase 7** - Integrations & Analytics (Google OAuth, Segment/PostHog, Zapier webhooks)
10. **Future: Phase 8** - CSV Import & Custom Email Domains (data migration, Resend custom domains)
11. **Follow Medusa UI guidelines** - Use only Medusa UI components for admin

---

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Commerce Modules Reference](https://docs.medusajs.com/resources/commerce-modules)
- [Custom Modules Guide](https://docs.medusajs.com/learn/fundamentals/modules)
- [Module Links Guide](https://docs.medusajs.com/learn/fundamentals/module-links)
- [Workflow System](https://docs.medusajs.com/learn/fundamentals/workflows)
- [API Routes](https://docs.medusajs.com/learn/fundamentals/api-routes)