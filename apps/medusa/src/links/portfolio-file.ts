import PortfolioModule from "@/modules/portfolio"
import FileModule from "@medusajs/medusa/file"
import { defineLink } from "@medusajs/framework/utils"

// Portfolio can have branding assets (logo, custom images)
export default defineLink(
  PortfolioModule.linkable.portfolio,
  {
    linkable: FileModule.linkable.file,
    isList: true,
  }
)
