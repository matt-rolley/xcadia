import { defineLink } from "@medusajs/framework/utils"
import DealModule from "@/modules/deal"

export default defineLink(
  DealModule.linkable.dealScenario,
  DealModule.linkable.deal
)
