import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createCompanyStep, CreateCompanyStepInput } from "./steps/create-company"
import { COMPANY_MODULE } from "@/modules/company"
import { TEAM_MODULE } from "@/modules/team"

export const createCompanyWorkflow = createWorkflow(
  "create-company",
  function (input: CreateCompanyStepInput) {
    // Step 1: Create the company
    const company = createCompanyStep(input)

    // Step 2: Create link between Company and Team
    createRemoteLinkStep([
      {
        [COMPANY_MODULE]: {
          company_id: company.id,
        },
        [TEAM_MODULE]: {
          team_id: input.team_id,
        },
      },
    ])

    // Step 3: Emit event for any post-creation actions
    emitEventStep({
      eventName: "company.created",
      data: {
        company_id: company.id,
        team_id: input.team_id,
      },
    })

    return new WorkflowResponse({
      company,
    })
  }
)
