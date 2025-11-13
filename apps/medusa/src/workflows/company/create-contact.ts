import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { createContactStep, CreateContactStepInput } from "./steps/create-contact"

// Step: Validate company belongs to team
const validateCompanyStep = createStep(
  "validate-company-for-contact",
  async ({ company_id, team_id }: { company_id: string; team_id: string }, { container }) => {
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

export const createContactWorkflow = createWorkflow(
  "create-contact",
  function (input: CreateContactStepInput & { team_id: string }) {
    // Step 1: Validate company belongs to team
    validateCompanyStep({
      company_id: input.company_id,
      team_id: input.team_id,
    })

    // Step 2: Create the contact
    const contact = createContactStep(input)

    // Step 3: Emit event for any post-creation actions
    emitEventStep({
      eventName: "contact.created",
      data: {
        contact_id: contact.id,
        company_id: input.company_id,
        email: input.email,
      },
    })

    return new WorkflowResponse({
      contact,
    })
  }
)
