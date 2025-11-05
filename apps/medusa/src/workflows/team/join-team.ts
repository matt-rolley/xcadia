import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

export type JoinTeamWorkflowInput = {
  team_id: string
  user_id: string
  user_email: string
}

export const joinTeamWorkflow = createWorkflow(
  "join-team",
  function (input: JoinTeamWorkflowInput) {
    // Note: The team member should already exist from the invite workflow
    // This workflow emits an event for the subscriber to handle notifications

    // Emit event for welcome email and team owner notifications
    emitEventStep({
      eventName: "team.member_joined",
      data: {
        team_id: input.team_id,
        user_id: input.user_id,
        user_email: input.user_email,
      },
    })

    return new WorkflowResponse({
      success: true,
    })
  }
)
