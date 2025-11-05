import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { validateTeamPermissionStep } from "./steps/validate-team-permission"
import { createTeamMemberStep } from "./steps/create-team-member"

export type InviteMemberWorkflowInput = {
  team_id: string
  inviter_user_id: string
  invited_user_id: string
  invited_user_email: string
  role: "member" | "owner"
}

export const inviteMemberWorkflow = createWorkflow(
  "invite-member",
  function (input: InviteMemberWorkflowInput) {
    // Step 1: Validate that the inviter is a team owner
    validateTeamPermissionStep({
      team_id: input.team_id,
      user_id: input.inviter_user_id,
      required_role: "owner",
    })

    // Step 2: Add the invited user as a team member
    const teamMember = createTeamMemberStep({
      team_id: input.team_id,
      user_id: input.invited_user_id,
      role: input.role,
      invited_by: input.inviter_user_id,
    })

    // Step 3: Emit event for subscriber to handle notification
    emitEventStep({
      eventName: "team.member_invited",
      data: {
        team_id: input.team_id,
        inviter_user_id: input.inviter_user_id,
        invited_user_id: input.invited_user_id,
        invited_user_email: input.invited_user_email,
        role: input.role,
      },
    })

    return new WorkflowResponse({
      teamMember,
    })
  }
)
