import { model } from "@medusajs/framework/utils"

const Team = model.define("team", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
})

export default Team
