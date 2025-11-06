import { defineLink } from "@medusajs/framework/utils"
import EmailModule from "@/modules/email"
import PortfolioModule from "@/modules/portfolio"

export default defineLink(
  EmailModule.linkable.portfolioEmail,
  PortfolioModule.linkable.portfolio
)
