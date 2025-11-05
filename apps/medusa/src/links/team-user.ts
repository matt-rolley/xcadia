import TeamModule from "@/modules/team"
import UserModule from "@medusajs/medusa/user"
import { defineLink } from "@medusajs/framework/utils"

// Link Team to User via TeamMember (many-to-many relationship)
export default defineLink(
  {
    linkable: TeamModule.linkable.teamMember,
    isList: true,
  },
  UserModule.linkable.user
)
