import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { createCompanyStep, CreateCompanyStepInput } from "./steps/create-company"

export const createCompanyWorkflow = createWorkflow(
  "create-company",
  function (input: CreateCompanyStepInput) {
    // Step 1: Create the company
    const company = createCompanyStep(input)

    // Step 2: Emit event for any post-creation actions
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
