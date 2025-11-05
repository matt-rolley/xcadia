import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import TeamModuleService from "@/modules/team/service"
import { TEAM_MODULE } from "@/modules/team"

// GET /admin/teams/:id - Get a single team
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamModuleService: TeamModuleService = req.scope.resolve(TEAM_MODULE)

  const team = await teamModuleService.retrieveTeam(id)

  if (!team) {
    res.status(404).json({
      error: "Team not found",
    })
    return
  }

  res.json({
    team,
  })
}
