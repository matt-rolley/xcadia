import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createTeamStep, CreateTeamStepInput } from "./steps/create-team"
import { createTeamMemberStep } from "./steps/create-team-member"

export type CreateTeamWorkflowInput = CreateTeamStepInput & {
  creator_user_id: string
}

export const createTeamWorkflow = createWorkflow(
  "create-team",
  function (input: CreateTeamWorkflowInput) {
    // Step 1: Create the team
    const team = createTeamStep({
      name: input.name,
      slug: input.slug,
    })

    // Step 2: Add the creator as owner
    const teamMember = createTeamMemberStep({
      team_id: team.id,
      user_id: input.creator_user_id,
      role: "owner",
    })

    return new WorkflowResponse({
      team,
      teamMember,
    })
  }
)
