import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { createProjectStep, CreateProjectStepInput } from "./steps/create-project"

export const createProjectWorkflow = createWorkflow(
  "create-project",
  function (input: CreateProjectStepInput) {
    const project = createProjectStep(input)

    emitEventStep({
      eventName: "project.created",
      data: {
        project_id: project.id,
        team_id: input.team_id,
      },
    })

    return new WorkflowResponse({ project })
  }
)
