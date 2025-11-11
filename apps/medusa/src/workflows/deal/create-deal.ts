import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DEAL_MODULE } from "@/modules/deal"

type CreateDealInput = {
  team_id: string
  company_id: string
  contact_id?: string
  portfolio_id?: string
  name: string
  description?: string
  deal_type: string
  stage?: string
  probability?: number
  expected_close_date?: string
  currency?: string
  created_by: string
  assigned_to?: string
  metadata?: any
}

type CreateDealOutput = {
  deal: any
}

// Step 1: Validate company belongs to team
const validateCompanyStep = createStep(
  "validate-company",
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

// Step 2: Create the deal
const createDealStep = createStep(
  "create-deal",
  async (input: CreateDealInput, { container }) => {
    const dealModuleService = container.resolve("dealModuleService")

    const deal = await dealModuleService.createDeals({
      team_id: input.team_id,
      company_id: input.company_id,
      contact_id: input.contact_id || null,
      portfolio_id: input.portfolio_id || null,
      name: input.name,
      description: input.description || null,
      deal_type: input.deal_type,
      stage: input.stage || "lead",
      probability: input.probability || null,
      expected_close_date: input.expected_close_date ? new Date(input.expected_close_date) : null,
      currency: input.currency || "USD",
      created_by: input.created_by,
      assigned_to: input.assigned_to || null,
      metadata: input.metadata || null,
    })

    return new StepResponse(
      { deal },
      {
        compensate: async () => {
          // Rollback: Delete created deal
          await dealModuleService.softDeleteDeals([deal.id])
        },
      }
    )
  }
)

export const createDealWorkflow = createWorkflow(
  "create-deal",
  function (input: CreateDealInput): WorkflowResponse<CreateDealOutput> {
    // Step 1: Validate company belongs to team
    validateCompanyStep({
      company_id: input.company_id,
      team_id: input.team_id,
    })

    // Step 2: Create deal
    const { deal } = createDealStep(input)

    return new WorkflowResponse({
      deal,
    })
  }
)
