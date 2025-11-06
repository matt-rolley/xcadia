import { model } from "@medusajs/framework/utils"
import Company from "./company"

const Contact = model.define("contact", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  title: model.text().nullable(), // Job title
  notes: model.text().nullable(),
  is_primary: model.boolean().default(false), // Primary contact for company

  // Many-to-one relationship with Company
  company: model.belongsTo(() => Company, {
    mappedBy: "contacts",
  }),
})

export default Contact
