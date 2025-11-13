import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emitEventStep, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createProjectStep, CreateProjectStepInput } from "./steps/create-project"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { TEAM_MODULE } from "@/modules/team"
import { COMPANY_MODULE } from "@/modules/company"

// Step: Validate company belongs to team if provided
const validateCompanyStep = createStep(
  "validate-company-for-project",
  async ({ company_id, team_id }: { company_id?: string; team_id: string }, { container }) => {
    if (!company_id) {
      return new StepResponse({ validated: true })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "team_id"],
      filters: { id: company_id },
    })

    if (!companies || companies.length === 0) {
      throw new Error("Company not found")
    }

    if (companies[0].team_id !== team_id) {
      throw new Error("Company does not belong to your team")
    }

    return new StepResponse({ company: companies[0] })
  }
)

export const createProjectWorkflow = createWorkflow(
  "create-project",
  function (input: CreateProjectStepInput) {
    // Step 1: Validate company if provided
    validateCompanyStep({
      company_id: input.company_id,
      team_id: input.team_id,
    })

    // Step 2: Create project
    const project = createProjectStep(input)

    // Step 3: Link project to team
    createRemoteLinkStep([
      {
        [PORTFOLIO_MODULE]: { project_id: project.id },
        [TEAM_MODULE]: { team_id: input.team_id },
      },
    ])

    // Step 4: Link to company if provided
    when({ input }, ({ input }) => !!input.company_id).then(() => {
      createRemoteLinkStep([
        {
          [PORTFOLIO_MODULE]: { project_id: project.id },
          [COMPANY_MODULE]: { company_id: input.company_id },
        },
      ]).config({ name: "link-project-to-company" })
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
