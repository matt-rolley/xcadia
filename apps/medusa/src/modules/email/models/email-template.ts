import { model } from "@medusajs/framework/utils"

const EmailTemplate = model.define("email_template", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (enforces multi-tenancy)
  name: model.text(), // e.g., "portfolio-send", "deal-quote"
  subject: model.text(),
  html_content: model.text(),
  text_content: model.text().nullable(),
  variables: model.json().nullable(), // Schema for template variables
  is_active: model.boolean().default(true),
})

export default EmailTemplate
