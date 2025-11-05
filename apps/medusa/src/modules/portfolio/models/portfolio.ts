import { model } from "@medusajs/framework/utils"
import Project from "./project"

const Portfolio = model.define("portfolio", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (enforces multi-tenancy)
  contact_id: model.text().nullable(), // Who is receiving this portfolio
  title: model.text(),
  description: model.text().nullable(),
  slug: model.text().unique(), // URL-friendly identifier for public access
  password_hash: model.text().nullable(), // Optional password protection (plain text)
  expires_at: model.dateTime().nullable(), // Optional expiration date
  is_active: model.boolean().default(true), // Can be disabled without deleting
  view_count: model.number().default(0), // Track portfolio views
  metadata: model.json().nullable(), // Custom branding, colors, etc.

  // Many-to-many relationship to projects
  projects: model.manyToMany(() => Project, {
    mappedBy: "portfolios",
    pivotTable: "portfolio_project",
  }),
})

export default Portfolio
