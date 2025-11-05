import { model } from "@medusajs/framework/utils"

const Project = model.define("project", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (enforces multi-tenancy)
  company_id: model.text().nullable(), // Optional: link to client company
  title: model.text(),
  description: model.text().nullable(),
  category: model.text().nullable(), // e.g., "Web Design", "3D Modeling", "Photography"
  tags: model.json().nullable(), // Array of tags for filtering
  is_featured: model.boolean().default(false),
  display_order: model.number().default(0), // For custom sorting
  metadata: model.json().nullable(), // Custom metadata (dimensions, duration, etc.)
})

export default Project
