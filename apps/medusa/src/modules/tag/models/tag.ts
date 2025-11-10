import { model } from "@medusajs/framework/utils"

const Tag = model.define("tag", {
  id: model.id().primaryKey(),
  team_id: model.text(), // Foreign key to Team (for multi-tenancy)

  name: model.text(), // e.g., "High Priority", "Tech Industry", "Q1 2025"
  color: model.text().default("#3B82F6"), // Hex color code for visual distinction

  // Which entity types can use this tag
  entity_types: model.json().default(["project", "portfolio", "contact", "company", "deal"]),

  created_by: model.text(), // user_id who created tag
})
.indexes([
  { on: ["team_id"], name: "idx_tag_team" },
  { on: ["name", "team_id"], name: "idx_tag_name_team", unique: true }, // Unique tag names per team
])

export default Tag
