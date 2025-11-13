import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emitEventStep, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createPortfolioStep, CreatePortfolioStepInput } from "./steps/create-portfolio"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { TEAM_MODULE } from "@/modules/team"
import { COMPANY_MODULE } from "@/modules/company"

export type CreatePortfolioWorkflowInput = CreatePortfolioStepInput

// Step: Validate contact belongs to team if provided
const validateContactStep = createStep(
  "validate-contact-for-portfolio",
  async ({ contact_id, team_id }: { contact_id?: string; team_id: string }, { container }) => {
    if (!contact_id) {
      return new StepResponse({ validated: true })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: contacts } = await query.graph({
      entity: "contact",
      fields: ["id", "team_id"],
      filters: { id: contact_id },
    })

    if (!contacts || contacts.length === 0) {
      throw new Error("Contact not found")
    }

    if (contacts[0].team_id !== team_id) {
      throw new Error("Contact does not belong to your team")
    }

    return new StepResponse({ contact: contacts[0] })
  }
)

export const createPortfolioWorkflow = createWorkflow(
  "create-portfolio",
  function (input: CreatePortfolioWorkflowInput) {
    // Step 1: Validate contact if provided
    validateContactStep({
    
    })

    // Step 2: Create portfolio
    const portfolio = createPortfolioStep(input)

    // Step 3: Link portfolio to team
    createRemoteLinkStep([
      {
        [PORTFOLIO_MODULE]: { portfolio_id: portfolio.id },
        [TEAM_MODULE]: { team_id: input.team_id },
      },
    ])

    // Step 4: Link to contact if provided
    when({ input }, ({ input }) => !!input.contact_id).then(() => {
      createRemoteLinkStep([
        {
          [PORTFOLIO_MODULE]: { portfolio_id: portfolio.id },
          [COMPANY_MODULE]: { contact_id: input.contact_id },
        },
      ]).config({ name: "link-portfolio-to-contact" })
    })

    // Emit event for subscribers
    emitEventStep({
      eventName: "portfolio.created",
      data: {
        portfolio_id: portfolio.id,
        team_id: input.team_id,
        contact_id: input.contact_id,
      },
    })

    return new WorkflowResponse({ portfolio })
  }
)
