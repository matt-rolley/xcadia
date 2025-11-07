import { model } from "@medusajs/framework/utils"

const InAppNotification = model.define("in_app_notification", {
  id: model.id().primaryKey(),
  team_id: model.text().index(), // FK to team module - indexed for team filtering
  user_id: model.text().index(), // FK to Medusa User - indexed for user filtering
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
  read: model.boolean().default(false).index(), // Indexed for unread queries
  read_at: model.dateTime().nullable(),
})

export default InAppNotification
