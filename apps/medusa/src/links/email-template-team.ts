import { defineLink } from "@medusajs/framework/utils"
import EmailModule from "@/modules/email"
import TeamModule from "@/modules/team"

export default defineLink(
  EmailModule.linkable.emailTemplate,
  TeamModule.linkable.team
)
