import PortfolioModule from "@/modules/portfolio"
import FileModule from "@medusajs/medusa/file"
import { defineLink } from "@medusajs/framework/utils"

// Project can have multiple files (images, videos, 3D models)
export default defineLink(
  PortfolioModule.linkable.project,
  {
    linkable: FileModule.linkable.file,
    isList: true,
  }
)
