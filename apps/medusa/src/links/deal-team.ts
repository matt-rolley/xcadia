import { defineLink } from "@medusajs/framework/utils"
import DealModule from "@/modules/deal"
import TeamModule from "@/modules/team"

export default defineLink(
  DealModule.linkable.deal,
  TeamModule.linkable.team
)
