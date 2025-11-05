import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

export type CreateTeamStepInput = {
  name: string
  slug: string
}

export const createTeamStep = createStep(
  "create-team",
  async ({ name, slug }: CreateTeamStepInput, { container }) => {
    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    const team = await teamModuleService.createTeams({
      name,
      slug,
    })

    return new StepResponse(team, { team_id: team.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    // Rollback: delete the created team
    await teamModuleService.deleteTeams(compensationData.team_id)
  }
)
