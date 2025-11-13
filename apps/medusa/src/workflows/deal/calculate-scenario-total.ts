import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type CalculateScenarioInput = {
  scenario_id: string
  team_id: string
}

type CalculateScenarioOutput = {
  subtotal: number
  tax_amount: number
  total: number
}

// Step 1: Validate scenario belongs to team
const validateScenarioStep = createStep(
  "validate-scenario-ownership",
  async ({ scenario_id, team_id }: { scenario_id: string; team_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch scenario with its deal to check team ownership
    const { data: scenarios } = await query.graph({
      entity: "deal_scenario",
      fields: ["id", "deal.*"],
      filters: { id: scenario_id },
    })

    if (!scenarios || scenarios.length === 0) {
      throw new Error("Scenario not found")
    }

    const scenario = scenarios[0]

    if (!scenario.deal || scenario.deal.team_id !== team_id) {
      throw new Error("Scenario does not belong to your team")
    }

    return new StepResponse({ validated: true })
  }
)

// Step 2: Fetch all line items for the scenario
const fetchLineItemsStep = createStep(
  "fetch-line-items",
  async ({ scenario_id }: { scenario_id: string }, { container }) => {
    const dealModuleService = container.resolve("dealModuleService")

    const lineItems = await dealModuleService.listDealLineItems({
      filters: { scenario_id },
    })

    return new StepResponse({ lineItems })
  }
)

// Step 3: Calculate subtotal from line items
const calculateSubtotalStep = createStep(
  "calculate-subtotal",
  async ({ lineItems }: { lineItems: any[] }) => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + parseFloat(item.total_price || 0)
    }, 0)

    return new StepResponse({ subtotal })
  }
)

// Step 4: Fetch scenario to get tax/discount rates
const fetchScenarioStep = createStep(
  "fetch-scenario",
  async ({ scenario_id }: { scenario_id: string }, { container }) => {
    const dealModuleService = container.resolve("dealModuleService")

    const scenario = await dealModuleService.retrieveDealScenario(scenario_id)

    return new StepResponse({ scenario })
  }
)

// Step 5: Calculate tax and discounts
const calculateTotalsStep = createStep(
  "calculate-totals",
  async (
    {
      subtotal,
      scenario,
    }: {
      subtotal: number
      scenario: any
    }
  ) => {
    // Calculate tax
    const taxAmount = (subtotal * (scenario.tax_rate || 0)) / 100

    // Calculate discount
    let discountAmount = scenario.discount_amount || 0
    if (scenario.discount_percentage > 0) {
      discountAmount = (subtotal * scenario.discount_percentage) / 100
    }

    // Calculate final total
    const total = subtotal + taxAmount - discountAmount

    return new StepResponse({
      subtotal,
      taxAmount,
      discountAmount,
      total,
    })
  }
)

// Step 6: Update scenario with calculated values
const updateScenarioStep = createStep(
  "update-scenario",
  async (
    {
      scenario_id,
      subtotal,
      taxAmount,
      discountAmount,
      total,
    }: {
      scenario_id: string
      subtotal: number
      taxAmount: number
      discountAmount: number
      total: number
    },
    { container }
  ) => {
    const dealModuleService = container.resolve("dealModuleService")

    await dealModuleService.updateDealScenarios({
      id: scenario_id,
      subtotal,
      tax_amount: taxAmount,
      total,
    })

    return new StepResponse({ success: true })
  }
)

export const calculateScenarioTotalWorkflow = createWorkflow(
  "calculate-scenario-total",
  function (input: CalculateScenarioInput): WorkflowResponse<CalculateScenarioOutput> {
    // Step 1: Validate scenario belongs to team
    validateScenarioStep({
      scenario_id: input.scenario_id,
      team_id: input.team_id,
    })

    // Step 2: Fetch line items
    const { lineItems } = fetchLineItemsStep({
      scenario_id: input.scenario_id,
    })

    // Step 3: Calculate subtotal
    const { subtotal } = calculateSubtotalStep({ lineItems })

    // Step 4: Fetch scenario
    const { scenario } = fetchScenarioStep({
      scenario_id: input.scenario_id,
    })

    // Step 5: Calculate totals
    const { subtotal: finalSubtotal, taxAmount, discountAmount, total } = calculateTotalsStep({
      subtotal,
      scenario,
    })

    // Step 6: Update scenario
    updateScenarioStep({
      scenario_id: input.scenario_id,
      subtotal: finalSubtotal,
      taxAmount,
      discountAmount,
      total,
    })

    return new WorkflowResponse({
      subtotal: finalSubtotal,
      tax_amount: taxAmount,
      total,
    })
  }
)
