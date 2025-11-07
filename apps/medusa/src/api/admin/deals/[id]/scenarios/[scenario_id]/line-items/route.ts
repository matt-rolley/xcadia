import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DEAL_MODULE } from "@/modules/deal"
import { calculateScenarioTotalWorkflow } from "@/workflows/deal/calculate-scenario-total"
import { z } from "zod"

const CreateLineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().positive().default(1),
  unit_price: z.number(),
  metadata: z.any().optional(),
})

// POST /admin/deals/:id/scenarios/:scenario_id/line-items - Add line item to scenario
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: deal_id, scenario_id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  // Validate input
  const validation = CreateLineItemSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    // Verify deal belongs to team
    const deal = await dealModuleService.retrieveDeal(deal_id)

    if (deal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // Verify scenario belongs to deal
    const scenario = await dealModuleService.retrieveDealScenario(scenario_id)

    if (scenario.deal_id !== deal_id) {
      res.status(400).json({ error: "Scenario does not belong to this deal" })
      return
    }

    // Calculate total price
    const totalPrice = data.quantity * data.unit_price

    // Create line item
    const lineItem = await dealModuleService.createDealLineItems({
      scenario_id,
      name: data.name,
      description: data.description || null,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_price: totalPrice,
      metadata: data.metadata || null,
    })

    // Recalculate scenario total
    await calculateScenarioTotalWorkflow(req.scope).run({
      input: { scenario_id },
    })

    res.status(201).json({ line_item: lineItem })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create line item"
    res.status(400).json({ error: message })
  }
}

// GET /admin/deals/:id/scenarios/:scenario_id/line-items - List line items for scenario
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: deal_id, scenario_id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  try {
    // Verify deal belongs to team
    const deal = await dealModuleService.retrieveDeal(deal_id)

    if (deal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // List line items
    const lineItems = await dealModuleService.listDealLineItems({
      filters: { scenario_id },
    })

    res.json({ line_items: lineItems })
  } catch (error) {
    console.error("Failed to list line items:", error)
    res.status(500).json({ error: "Failed to list line items" })
  }
}
