import { defineLink } from "@medusajs/framework/utils"
import EmailModule from "@/modules/email"
import CompanyModule from "@/modules/company"

export default defineLink(
  EmailModule.linkable.portfolioEmail,
  CompanyModule.linkable.contact
)
