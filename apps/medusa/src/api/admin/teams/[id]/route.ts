import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import TeamModuleService from "@/modules/team/service"
import { TEAM_MODULE } from "@/modules/team"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PatchAdminUpdateTeam } from "@/api/admin/teams/validators"

// GET /admin/teams/:id - Get a single team with linked data
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: teams } = await query.graph({
      entity: "team",
      fields: ["*"],
      filters: { id },
    })

    if (!teams || teams.length === 0) {
      res.status(404).json({ error: "Team not found" })
      return
    }

    res.json({ team: teams[0] })
  } catch (error) {
    res.status(404).json({ error: "Team not found" })
  }
}

// PATCH /admin/teams/:id - Update a team
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamModuleService: TeamModuleService = req.scope.resolve(TEAM_MODULE)

  // Validate input with Zod
  const validation = PatchAdminUpdateTeam.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    const team = await teamModuleService.updateTeams({
      id,
      ...data,
    })

    res.json({ team })
  } catch (error) {
    res.status(404).json({ error: "Team not found" })
  }
}

// DELETE /admin/teams/:id - Delete a team (soft delete)
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamModuleService: TeamModuleService = req.scope.resolve(TEAM_MODULE)

  try {
    await teamModuleService.softDeleteTeams([id])
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ error: "Team not found" })
  }
}
