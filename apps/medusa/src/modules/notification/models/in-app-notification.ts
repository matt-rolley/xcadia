import { model } from "@medusajs/framework/utils"

const InAppNotification = model.define("in_app_notification", {
  id: model.id().primaryKey(),
  team_id: model.text(), // FK to team module
  user_id: model.text(), // FK to Medusa User
  type: model.enum([
    "portfolio_viewed",
    "portfolio_sent",
    "deal_updated",
    "member_joined",
    "member_invited",
    "email_opened",
    "email_clicked",
    "project_created",
    "company_created",
    "contact_created",
  ]),
  title: model.text(), // e.g., "Portfolio viewed by Acme Corp"
  message: model.text(), // Detailed message
  entity_type: model.text().nullable(), // e.g., "portfolio"
  entity_id: model.text().nullable(), // Link to entity
  read: model.boolean().default(false),
  read_at: model.dateTime().nullable(),
})
.indexes([
  { on: ["team_id"], name: "idx_notification_team" },
  { on: ["user_id"], name: "idx_notification_user" },
  { on: ["read"], name: "idx_notification_read" },
])

export default InAppNotification
