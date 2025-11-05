import { MedusaService } from "@medusajs/framework/utils"
import Team from "./models/team"
import TeamMember from "./models/team-member"

class TeamModuleService extends MedusaService({
  Team,
  TeamMember,
}) {}

export default TeamModuleService
