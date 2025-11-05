import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

export type ValidateTeamPermissionInput = {
  team_id: string
  user_id: string
  required_role?: "owner" | "member"
}

export const validateTeamPermissionStep = createStep(
  "validate-team-permission",
  async (input: ValidateTeamPermissionInput, { container }) => {
    const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

    // Check if user is a member of the team
    const teamMembers = await teamModuleService.listTeamMembers({
      filters: {
        team_id: input.team_id,
        user_id: input.user_id,
      },
    })

    if (!teamMembers || (Array.isArray(teamMembers) && teamMembers.length === 0)) {
      throw new Error("User is not a member of this team")
    }

    const teamMember = Array.isArray(teamMembers) ? teamMembers[0] : teamMembers

    // If a specific role is required, check it
    if (input.required_role === "owner" && teamMember.role !== "owner") {
      throw new Error("User must be a team owner to perform this action")
    }

    return new StepResponse({ teamMember })
  }
  // No compensation needed for validation
)
