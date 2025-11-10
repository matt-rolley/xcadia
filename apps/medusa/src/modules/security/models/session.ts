import { model } from "@medusajs/framework/utils"

const Session = model.define("session", {
  id: model.id().primaryKey(),
  user_id: model.text(), // Foreign key to Medusa User

  token_hash: model.text(), // Hashed JWT token for revocation checking
  device: model.text().nullable(), // Parsed from user agent (e.g., "Chrome on macOS")
  ip_address: model.text().nullable(), // Request IP address
  user_agent: model.text().nullable(), // Full user agent string

  last_activity: model.dateTime(), // Last request timestamp
  expires_at: model.dateTime(), // Session expiry

  revoked: model.boolean().default(false), // Manually revoked
  revoked_at: model.dateTime().nullable(),
  revoke_reason: model.text().nullable(), // "user_logout", "security_event", "admin_action"
})
.indexes([
  { on: ["user_id"], name: "idx_session_user" },
  { on: ["token_hash"], name: "idx_session_token" },
  { on: ["expires_at"], name: "idx_session_expires" },
  { on: ["revoked"], name: "idx_session_revoked" },
])

export default Session
