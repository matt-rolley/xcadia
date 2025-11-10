import { defineLink } from "@medusajs/framework/utils"
import PortfolioModule from "@/modules/portfolio"
import TagModule from "@/modules/tag"

export default defineLink(
  {
    linkable: PortfolioModule.linkable.portfolio,
    isList: true,
  },
  {
    linkable: TagModule.linkable.tag,
    isList: true,
  }
)
