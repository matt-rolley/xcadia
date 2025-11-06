import { model } from "@medusajs/framework/utils"

const EmailEvent = model.define("email_event", {
  id: model.id().primaryKey(),
  portfolio_email_id: model.text(), // Foreign key to PortfolioEmail
  event_type: model.enum(["opened", "clicked", "bounced", "delivered", "failed"]),
  occurred_at: model.dateTime(),
  user_agent: model.text().nullable(),
  ip_address: model.text().nullable(),
  link_url: model.text().nullable(), // For click events
  metadata: model.json().nullable(),
})

export default EmailEvent
