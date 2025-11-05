import { model } from "@medusajs/framework/utils"

const Contact = model.define("contact", {
  id: model.id().primaryKey(),
  company_id: model.text(), // Foreign key to Company (inherits team_id from company)
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  title: model.text().nullable(), // Job title
  notes: model.text().nullable(),
  is_primary: model.boolean().default(false), // Primary contact for company
})

export default Contact
