import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

export type RemoveTeamMemberStepInput = {
  team_id: string
  user_id: string
}

export const removeTeamMemberStep = createStep(
  "remove-team-member",
  async (input: RemoveTeamMemberStepInput, { container }) => {
    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    // Find the team member to remove
    const teamMembers = await teamModuleService.listTeamMembers({
      filters: {
        team_id: input.team_id,
        user_id: input.user_id,
      },
    })

    if (!teamMembers || (Array.isArray(teamMembers) && teamMembers.length === 0)) {
      throw new Error("Team member not found")
    }

    const teamMember = Array.isArray(teamMembers) ? teamMembers[0] : teamMembers

    // Check if trying to remove an owner
    if (teamMember.role === "owner") {
      // Count total owners
      const owners = await teamModuleService.listTeamMembers({
        filters: {
          team_id: input.team_id,
          role: "owner",
        },
      })

      const ownerCount = Array.isArray(owners) ? owners.length : 1
      if (ownerCount <= 1) {
        throw new Error("Cannot remove the last owner of a team")
      }
    }

    // Delete the team member
    await teamModuleService.deleteTeamMembers(teamMember.id)

    return new StepResponse({ removed: true }, { teamMember })
  },
  async (compensationData, { container }) => {
    if (!compensationData?.teamMember) {
      return
    }

    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    // Rollback: restore the team member
    await teamModuleService.createTeamMembers({
      team_id: compensationData.teamMember.team_id,
      user_id: compensationData.teamMember.user_id,
      role: compensationData.teamMember.role,
      invited_by: compensationData.teamMember.invited_by,
      joined_at: compensationData.teamMember.joined_at,
    })
  }
)
