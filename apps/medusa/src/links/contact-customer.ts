import CompanyModule from "@/modules/company"
import CustomerModule from "@medusajs/medusa/customer"
import { defineLink } from "@medusajs/framework/utils"

// Optional link: Contact can be associated with a Medusa Customer
export default defineLink(
  CompanyModule.linkable.contact,
  CustomerModule.linkable.customer
)
