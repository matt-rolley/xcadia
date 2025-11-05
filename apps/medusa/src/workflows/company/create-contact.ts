import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { createContactStep, CreateContactStepInput } from "./steps/create-contact"

export const createContactWorkflow = createWorkflow(
  "create-contact",
  function (input: CreateContactStepInput) {
    // Step 1: Create the contact
    const contact = createContactStep(input)

    // Step 2: Emit event for any post-creation actions
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
