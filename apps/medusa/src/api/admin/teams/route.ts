import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import TeamModuleService from "@/modules/team/service"
import { TEAM_MODULE } from "@/modules/team"
import { createTeamWorkflow } from "@/workflows/team/create-team"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PostAdminCreateTeam } from "./validators"

// GET /admin/teams - List all teams with linked data
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: teams } = await query.graph({
    entity: "team",
    fields: ["*"],
  })

  res.json({ teams })
}

// POST /admin/teams - Create a new team
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Validate input with Zod
  const validation = PostAdminCreateTeam.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const { name, slug, creator_user_id } = req.body as {
    name: string
    slug: string
    creator_user_id: string
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
