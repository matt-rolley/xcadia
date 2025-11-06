import { model } from "@medusajs/framework/utils"

const PortfolioEmail = model.define("portfolio_email", {
  id: model.id().primaryKey(),
  portfolio_id: model.text(), // Foreign key to Portfolio (inherits team_id)
  contact_id: model.text(), // Foreign key to Contact
  tracking_id: model.text().unique(), // UUID for tracking opens/clicks
  subject: model.text(),
  sent_at: model.dateTime(),
  opened_at: model.dateTime().nullable(),
  clicked_at: model.dateTime().nullable(),
  bounced_at: model.dateTime().nullable(),
  bounce_reason: model.text().nullable(),
  metadata: model.json().nullable(), // Additional data (e.g., custom message)
})

export default PortfolioEmail
