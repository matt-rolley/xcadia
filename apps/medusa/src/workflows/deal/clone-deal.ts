import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DEAL_MODULE } from "@/modules/deal"

type CloneDealInput = {
  deal_id: string
  team_id: string
  created_by: string
  name?: string // Optional: override the cloned deal name
  company_id?: string // Optional: assign to different company
  contact_id?: string // Optional: assign to different contact
  assigned_to?: string // Optional: assign to different user
}

type CloneDealOutput = {
  deal: any
  scenarios: any[]
}

// Step 1: Fetch the original deal with all its scenarios and line items
const fetchOriginalDealStep = createStep(
  "fetch-original-deal",
  async ({ deal_id, team_id }: { deal_id: string; team_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch the deal with its scenarios
    const { data: deals } = await query.graph({
      entity: "deal",
      fields: [
        "id",
        "team_id",
        "company_id",
        "contact_id",
        "portfolio_id",
        "name",
        "description",
        "deal_type",
        "currency",
        "metadata",
        "scenarios.*",
        "scenarios.line_items.*",
      ],
      filters: { id: deal_id },
    })

    if (!deals || deals.length === 0) {
      throw new Error("Deal not found")
    }

    const deal = deals[0]

    if (deal.team_id !== team_id) {
      throw new Error("Deal does not belong to your team")
    }

    return new StepResponse({ originalDeal: deal })
  }
)

// Step 2: Validate new company/contact if provided
const validateNewReferencesStep = createStep(
  "validate-new-references",
  async (
    { team_id, company_id, contact_id }: { team_id: string; company_id?: string; contact_id?: string },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Validate company belongs to team if provided
    if (company_id) {
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
    }

    // Validate contact belongs to team if provided
    if (contact_id) {
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
    }

    return new StepResponse({ validated: true })
  }
)

// Step 3: Create the cloned deal
const createClonedDealStep = createStep(
  "create-cloned-deal",
  async (
    input: CloneDealInput & { originalDeal: any },
    { container }
  ) => {
    const dealModuleService = container.resolve(DEAL_MODULE)
    const { originalDeal } = input

    // Create the new deal with reset fields
    const clonedDeal = await dealModuleService.createDeals({
      team_id: input.team_id,
      company_id: input.company_id || originalDeal.company_id,
      contact_id: input.contact_id || originalDeal.contact_id || null,
      portfolio_id: null, // Don't carry over portfolio association
      name: input.name || `Copy of ${originalDeal.name}`,
      description: originalDeal.description,
      deal_type: originalDeal.deal_type,
      stage: "lead", // Reset to initial stage
      probability: null, // Reset probability
      expected_close_date: null, // Reset dates
      actual_close_date: null,
      currency: originalDeal.currency,
      created_by: input.created_by,
      assigned_to: input.assigned_to || originalDeal.assigned_to || null,
      cloned_from_deal_id: originalDeal.id, // Track the original
      metadata: originalDeal.metadata,
    })

    return new StepResponse(
      { clonedDeal },
      {
        compensate: async () => {
          // Rollback: Delete cloned deal
          await dealModuleService.softDeleteDeals([clonedDeal.id])
        },
      }
    )
  }
)

// Step 4: Clone all scenarios and their line items
const cloneScenariosStep = createStep(
  "clone-scenarios",
  async (
    { originalDeal, clonedDeal }: { originalDeal: any; clonedDeal: any },
    { container }
  ) => {
    const dealModuleService = container.resolve(DEAL_MODULE)

    const clonedScenarios = []

    // Clone each scenario
    for (const scenario of originalDeal.scenarios || []) {
      const clonedScenario = await dealModuleService.createDealScenarios({
        deal_id: clonedDeal.id,
        name: scenario.name,
        description: scenario.description,
        is_active: scenario.is_active,
        is_selected: false, // Reset selection
        subtotal: scenario.subtotal,
        tax_rate: scenario.tax_rate,
        tax_amount: scenario.tax_amount,
        discount_amount: scenario.discount_amount,
        discount_percentage: scenario.discount_percentage,
        total: scenario.total,
        metadata: scenario.metadata,
      })

      // Clone all line items for this scenario
      for (const lineItem of scenario.line_items || []) {
        await dealModuleService.createDealLineItems({
          scenario_id: clonedScenario.id,
          name: lineItem.name,
          description: lineItem.description,
          quantity: lineItem.quantity,
          unit_price: lineItem.unit_price,
          total_price: lineItem.total_price,
          template_id: lineItem.template_id,
          metadata: lineItem.metadata,
        })
      }

      clonedScenarios.push(clonedScenario)
    }

    return new StepResponse(
      { scenarios: clonedScenarios },
      {
        compensate: async () => {
          // Rollback: Delete all cloned scenarios (line items cascade)
          const scenarioIds = clonedScenarios.map((s) => s.id)
          if (scenarioIds.length > 0) {
            await dealModuleService.softDeleteDealScenarios(scenarioIds)
          }
        },
      }
    )
  }
)

export const cloneDealWorkflow = createWorkflow(
  "clone-deal",
  function (input: CloneDealInput): WorkflowResponse<CloneDealOutput> {
    // Step 1: Fetch original deal
    const { originalDeal } = fetchOriginalDealStep({
      deal_id: input.deal_id,
      team_id: input.team_id,
    })

    // Step 2: Validate new company/contact if provided
    validateNewReferencesStep({
      team_id: input.team_id,
      company_id: input.company_id,
      contact_id: input.contact_id,
    })

    // Step 3: Create cloned deal
    const { clonedDeal } = createClonedDealStep({
      ...input,
      originalDeal,
    })

    // Step 4: Clone scenarios and line items
    const { scenarios } = cloneScenariosStep({
      originalDeal,
      clonedDeal,
    })

    return new WorkflowResponse({
      deal: clonedDeal,
      scenarios,
    })
  }
)
