import { model } from "@medusajs/framework/utils"

const TeamMember = model.define("team_member", {
  id: model.id().primaryKey(),
  team_id: model.text(),
  user_id: model.text(),
  role: model.enum(["owner", "member"]),
  invited_by: model.text().nullable(),
  joined_at: model.dateTime(),
})

export default TeamMember
