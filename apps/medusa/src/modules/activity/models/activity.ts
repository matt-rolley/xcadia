import { model } from "@medusajs/framework/utils"

const Activity = model.define("activity", {
  id: model.id().primaryKey(),
  team_id: model.text().index(), // FK to team module - indexed for team filtering
  user_id: model.text().nullable().index(), // FK to Medusa User - indexed for user filtering
  entity_type: model.enum([
    "project",
    "portfolio",
    "contact",
    "company",
    "deal",
    "team",
    "email",
  ]),
  entity_id: model.text(),
  action: model.enum([
    "created",
    "updated",
    "deleted",
    "sent",
    "viewed",
    "opened",
    "clicked",
    "invited",
    "joined",
    "left",
  ]),
  metadata: model.json().nullable(), // Additional context: what changed, who received it, etc.
  occurred_at: model.dateTime().index(), // Indexed for time-based queries
})

export default Activity
