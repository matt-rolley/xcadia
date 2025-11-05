import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

export type CreateTeamMemberStepInput = {
  team_id: string
  user_id: string
  role: "owner" | "member"
  invited_by?: string
}

export const createTeamMemberStep = createStep(
  "create-team-member",
  async (input: CreateTeamMemberStepInput, { container }) => {
    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    const teamMember = await teamModuleService.createTeamMembers({
      team_id: input.team_id,
      user_id: input.user_id,
      role: input.role,
      invited_by: input.invited_by || null,
      joined_at: new Date(),
    })

    return new StepResponse(teamMember, { team_member_id: teamMember.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    // Rollback: remove the team member
    await teamModuleService.deleteTeamMembers(compensationData.team_member_id)
  }
)
