import { defineLink } from "@medusajs/framework/utils"
import CompanyModule from "@/modules/company"
import TagModule from "@/modules/tag"

export default defineLink(
  {
    linkable: CompanyModule.linkable.contact,
    isList: true,
  },
  {
    linkable: TagModule.linkable.tag,
    isList: true,
  }
)
