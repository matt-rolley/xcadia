import { defineLink } from "@medusajs/framework/utils"
import UsageModule from "@/modules/usage"
import TeamModule from "@/modules/team"

// Link UsageTracker to Team (one-to-one per billing period)
export default defineLink(
  UsageModule.linkable.usageTracker,
  TeamModule.linkable.team
)
