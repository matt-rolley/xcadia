import CompanyModule from "@/modules/company"
import TeamModule from "@/modules/team"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  CompanyModule.linkable.company,
  TeamModule.linkable.team
)
