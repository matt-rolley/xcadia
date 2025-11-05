import TeamModule from "@/modules/team"
import FileModule from "@medusajs/medusa/file"
import { defineLink } from "@medusajs/framework/utils"

// Link Team to File (for team logo)
export default defineLink(
  TeamModule.linkable.team,
  FileModule.linkable.file
)
