import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import TeamModuleService from "@/modules/team/service"
import { TEAM_MODULE } from "@/modules/team"
import { createTeamWorkflow } from "@/workflows/team/create-team"

// GET /admin/teams - List all teams
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamModuleService: TeamModuleService = req.scope.resolve(TEAM_MODULE)

  const teams = await teamModuleService.listTeams()

  res.json({
    teams,
  })
}

// POST /admin/teams - Create a new team
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { name, slug, creator_user_id } = req.body as {
    name: string
    slug: string
    creator_user_id: string
  }

  // Validate input
  if (!name || !slug || !creator_user_id) {
    res.status(400).json({
      error: "Missing required fields: name, slug, creator_user_id",
    })
    return
  }

  // Execute workflow to create team
  const { result } = await createTeamWorkflow(req.scope).run({
    input: {
      name,
      slug,
      creator_user_id,
    },
  })

  res.status(201).json({
    team: result.team,
    teamMember: result.teamMember,
  })
}
