import PortfolioModule from "@/modules/portfolio"
import CompanyModule from "@/modules/company"
import { defineLink } from "@medusajs/framework/utils"

// Optional: Link project to client company
export default defineLink(
  PortfolioModule.linkable.project,
  CompanyModule.linkable.company
)
