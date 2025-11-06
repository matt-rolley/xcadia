import { model } from "@medusajs/framework/utils"
import Contact from "./contact"

const Company = model.define("company", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (enforces multi-tenancy)
  name: model.text(),
  website: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  country: model.text().nullable(),
  postal_code: model.text().nullable(),
  notes: model.text().nullable(),

  // One-to-many relationship with Contact
  contacts: model.hasMany(() => Contact, {
    mappedBy: "company",
  }),
})

export default Company
