import { defineLink } from "@medusajs/framework/utils"
import DealModule from "@/modules/deal"
import TagModule from "@/modules/tag"

export default defineLink(
  {
    linkable: DealModule.linkable.deal,
    isList: true,
  },
  {
    linkable: TagModule.linkable.tag,
    isList: true,
  }
)
