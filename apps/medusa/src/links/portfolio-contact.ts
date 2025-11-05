import PortfolioModule from "@/modules/portfolio"
import CompanyModule from "@/modules/company"
import { defineLink } from "@medusajs/framework/utils"

// Portfolio can be sent to a contact
export default defineLink(
  PortfolioModule.linkable.portfolio,
  CompanyModule.linkable.contact
)
