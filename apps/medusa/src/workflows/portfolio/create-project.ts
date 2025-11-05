import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { emitEventStep, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createProjectStep, CreateProjectStepInput } from "./steps/create-project"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { TEAM_MODULE } from "@/modules/team"
import { COMPANY_MODULE } from "@/modules/company"

export const createProjectWorkflow = createWorkflow(
  "create-project",
  function (input: CreateProjectStepInput) {
    const project = createProjectStep(input)

    // Link project to team
    createRemoteLinkStep([
      {
        [PORTFOLIO_MODULE]: { project_id: project.id },
        [TEAM_MODULE]: { team_id: input.team_id },
      },
    ])

    // Link to company if provided
    when({ input }, ({ input }) => !!input.company_id).then(() => {
      createRemoteLinkStep([
        {
          [PORTFOLIO_MODULE]: { project_id: project.id },
          [COMPANY_MODULE]: { company_id: input.company_id },
        },
      ])
    })

    emitEventStep({
      eventName: "project.created",
      data: {
        project_id: project.id,
        team_id: input.team_id,
        company_id: input.company_id,
      },
    })

    return new WorkflowResponse({ project })
  }
)
