import { model } from "@medusajs/framework/utils"

const UsageTracker = model.define("usage_tracker", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (for multi-tenancy)

  // Current billing period
  period_start: model.dateTime(),
  period_end: model.dateTime(),

  // Storage usage (in GB)
  storage_gb: model.number().default(0),
  storage_limit_gb: model.number().default(5), // Default: 5GB for free plan

  // Project count
  project_count: model.number().default(0),
  project_limit: model.number().default(10), // Default: 10 projects for free plan

  // Email sends
  email_count: model.number().default(0),
  email_limit: model.number().default(100), // Default: 100 emails/month for free plan

  // Portfolio views (optional tracking)
  portfolio_view_count: model.number().default(0),

  // Warning tracking
  storage_warning_sent: model.boolean().default(false),
  project_warning_sent: model.boolean().default(false),
  email_warning_sent: model.boolean().default(false),

  // Plan info (denormalized for quick access)
  plan_name: model.text().default("free"), // "free", "pro_monthly", "pro_yearly"
  plan_price: model.number().default(0), // Price in cents

  // Metadata for additional tracking
  metadata: model.json().nullable(),
})
.indexes([
  { on: ["team_id"], name: "idx_usage_team" },
  { on: ["period_end"], name: "idx_usage_period_end" },
])

export default UsageTracker
