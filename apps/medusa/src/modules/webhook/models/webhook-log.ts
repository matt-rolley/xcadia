import { model } from "@medusajs/framework/utils"

/**
 * Webhook Log Model
 * Tracks webhook delivery attempts for debugging and monitoring
 */
const WebhookLog = model.define("webhook_log", {
  id: model.id().primaryKey(),
  webhook_id: model.text(),
  team_id: model.text(),

  // Request details
  event_type: model.text(),
  payload: model.json(),
  url: model.text(),

  // Response details
  status_code: model.number().nullable(),
  response_body: model.text().nullable(),
  response_time_ms: model.number().nullable(),

  // Delivery status
  success: model.boolean().default(false),
  error: model.text().nullable(),
  retry_count: model.number().default(0),

  // Metadata
  metadata: model.json().nullable(),
})
.indexes([
  { on: ["webhook_id"], name: "idx_webhook_log_webhook" },
  { on: ["team_id"], name: "idx_webhook_log_team" },
  { on: ["event_type"], name: "idx_webhook_log_event" },
  { on: ["success"], name: "idx_webhook_log_success" },
  { on: ["created_at"], name: "idx_webhook_log_created" },
])

export default WebhookLog
