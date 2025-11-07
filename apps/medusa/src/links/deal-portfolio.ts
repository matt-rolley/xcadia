import { defineLink } from "@medusajs/framework/utils"
import DealModule from "@/modules/deal"
import PortfolioModule from "@/modules/portfolio"

export default defineLink(
  DealModule.linkable.deal,
  PortfolioModule.linkable.portfolio
)
