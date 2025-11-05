import PortfolioModule from "@/modules/portfolio"
import TeamModule from "@/modules/team"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  PortfolioModule.linkable.portfolio,
  TeamModule.linkable.team
)
