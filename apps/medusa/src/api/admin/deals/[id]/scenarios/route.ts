import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DEAL_MODULE } from "@/modules/deal"
import { z } from "zod"

const CreateScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tax_rate: z.number().default(0),
  discount_amount: z.number().default(0),
  discount_percentage: z.number().default(0),
  metadata: z.any().optional(),
})

// POST /admin/deals/:id/scenarios - Create scenario for deal
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: deal_id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  // Validate input
  const validation = CreateScenarioSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  try {
    // Verify deal belongs to team
    const deal = await dealModuleService.retrieveDeal(deal_id)

    if (deal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // Create scenario
    const scenario = await dealModuleService.createDealScenarios({
      deal_id,
      ...validation.data,
    })

    res.status(201).json({ scenario })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create scenario"
    res.status(400).json({ error: message })
  }
}

// GET /admin/deals/:id/scenarios - List scenarios for deal
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: deal_id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  try {
    // Verify deal belongs to team
    const deal = await dealModuleService.retrieveDeal(deal_id)

    if (deal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // List scenarios
    const scenarios = await dealModuleService.listDealScenarios({
      filters: { deal_id },
    })

    res.json({ scenarios })
  } catch (error) {
    console.error("Failed to list scenarios:", error)
    res.status(500).json({ error: "Failed to list scenarios" })
  }
}
