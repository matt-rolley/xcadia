import TeamModule from "@/modules/team"
import OrderModule from "@medusajs/medusa/order"
import { defineLink } from "@medusajs/framework/utils"

// Link Team to Order (for subscription tracking)
export default defineLink(
  TeamModule.linkable.team,
  {
    linkable: OrderModule.linkable.order,
    isList: true,
  }
)
