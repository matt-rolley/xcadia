import { model } from "@medusajs/framework/utils"

const Deal = model.define("deal", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (for multi-tenancy)
  company_id: model.text(), // Foreign key to Company
  contact_id: model.text().nullable(), // Foreign key to Contact (specific person)
  portfolio_id: model.text().nullable(), // Foreign key to Portfolio (if sent via portfolio)

  name: model.text(), // e.g., "Website Redesign for Acme Corp"
  description: model.text().nullable(),

  deal_type: model.enum(["project", "retainer", "consulting", "custom"]),
  stage: model.enum([
    "lead",
    "qualification",
    "proposal",
    "negotiation",
    "won",
    "lost",
    "on_hold"
  ]).default("lead"),

  probability: model.number().nullable(), // 0-100 percentage
  expected_close_date: model.dateTime().nullable(),
  actual_close_date: model.dateTime().nullable(),

  // Currency handling
  currency: model.text().default("USD"), // ISO currency code

  // Tracking
  created_by: model.text(), // user_id who created deal
  assigned_to: model.text().nullable(), // user_id assigned to this deal

  // Cloning
  cloned_from_deal_id: model.text().nullable(), // Original deal if this was cloned

  // Metadata for custom fields
  metadata: model.json().nullable(),
})

export default Deal
