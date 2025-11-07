import { model } from "@medusajs/framework/utils"

const Activity = model.define("activity", {
  id: model.id().primaryKey(),
  team_id: model.text(), // FK to team module
  user_id: model.text().nullable(), // FK to Medusa User - nullable for system events
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
  occurred_at: model.dateTime(),
})

export default Activity
