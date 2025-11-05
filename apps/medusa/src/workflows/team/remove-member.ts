import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { validateTeamPermissionStep } from "./steps/validate-team-permission"
import { removeTeamMemberStep } from "./steps/remove-team-member"

export type RemoveMemberWorkflowInput = {
  team_id: string
  remover_user_id: string
  user_id_to_remove: string
}

export const removeMemberWorkflow = createWorkflow(
  "remove-member",
  function (input: RemoveMemberWorkflowInput) {
    // Step 1: Validate that the remover is a team owner
    validateTeamPermissionStep({
      team_id: input.team_id,
      user_id: input.remover_user_id,
      required_role: "owner",
    })

    // Step 2: Remove the team member
    const result = removeTeamMemberStep({
      team_id: input.team_id,
      user_id: input.user_id_to_remove,
    })

    return new WorkflowResponse(result)
  }
)
