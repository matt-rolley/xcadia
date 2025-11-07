import { defineLink } from "@medusajs/framework/utils"
import DealModule from "@/modules/deal"
import CompanyModule from "@/modules/company"

export default defineLink(
  DealModule.linkable.deal,
  CompanyModule.linkable.contact
)
