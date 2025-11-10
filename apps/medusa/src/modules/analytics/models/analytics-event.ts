import { model } from "@medusajs/framework/utils"

/**
 * Analytics Event Model
 * Tracks user actions and system events for analytics and insights
 */
const AnalyticsEvent = model.define("analytics_event", {
  id: model.id().primaryKey(),
  team_id: model.text(),
  user_id: model.text().nullable(), // Nullable for anonymous events

  // Event details
  event_type: model.text(), // e.g., "portfolio_viewed", "project_created", "email_opened"
  event_category: model.enum([
    "portfolio",
    "project",
    "contact",
    "company",
    "deal",
    "email",
    "authentication",
    "integration",
    "other",
  ]),

  // Context
  entity_id: model.text().nullable(), // ID of related entity
  entity_type: model.text().nullable(), // Type of entity (project, portfolio, etc.)

  // Technical details
  ip_address: model.text().nullable(),
  user_agent: model.text().nullable(),
  device_type: model.text().nullable(), // mobile, desktop, tablet
  browser: model.text().nullable(),

  // Geographic data
  country: model.text().nullable(),
  city: model.text().nullable(),

  // Additional metadata
  metadata: model.json().nullable(), // Flexible JSON for event-specific data

  // Performance tracking
  duration_ms: model.number().nullable(), // For tracking operation duration
})
.indexes([
  { on: ["team_id"], name: "idx_analytics_team" },
  { on: ["user_id"], name: "idx_analytics_user" },
  { on: ["event_type"], name: "idx_analytics_event_type" },
  { on: ["event_category"], name: "idx_analytics_event_category" },
  { on: ["entity_id"], name: "idx_analytics_entity" },
  { on: ["created_at"], name: "idx_analytics_created" },
  { on: ["team_id", "event_type", "created_at"], name: "idx_analytics_team_event_time" },
])

export default AnalyticsEvent
