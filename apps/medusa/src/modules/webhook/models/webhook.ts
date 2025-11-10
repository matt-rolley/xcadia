import { model } from "@medusajs/framework/utils"

/**
 * Webhook Model
 * Configures webhook endpoints for third-party integrations (Zapier, Make.com, etc.)
 */
const Webhook = model.define("webhook", {
  id: model.id().primaryKey(),
  team_id: model.text(),

  // Webhook configuration
  name: model.text(),
  url: model.text(),
  secret: model.text().nullable(), // For webhook signature verification

  // Event triggers
  events: model.json(), // Array of event types to trigger webhook
  // e.g., ["project.created", "contact.created", "email.sent", "deal.won"]

  // Status
  enabled: model.boolean().default(true),

  // Authentication
  auth_type: model.enum(["none", "bearer", "basic", "custom"]).default("none"),
  auth_config: model.json().nullable(), // Flexible auth config

  // Delivery settings
  retry_config: model.json().default({
    max_retries: 3,
    retry_delay: 5000, // 5 seconds
    backoff_multiplier: 2,
  }),

  // Stats
  success_count: model.number().default(0),
  failure_count: model.number().default(0),
  last_triggered_at: model.dateTime().nullable(),
  last_success_at: model.dateTime().nullable(),
  last_failure_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),

  // Metadata
  metadata: model.json().nullable(),
})
.indexes([
  { on: ["team_id"], name: "idx_webhook_team" },
  { on: ["enabled"], name: "idx_webhook_enabled" },
  { on: ["team_id", "enabled"], name: "idx_webhook_team_enabled" },
])

export default Webhook
