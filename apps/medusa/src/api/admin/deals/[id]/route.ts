import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DEAL_MODULE } from "@/modules/deal"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"

const UpdateDealSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  deal_type: z.enum(["project", "retainer", "consulting", "custom"]).optional(),
  stage: z.enum(["lead", "qualification", "proposal", "negotiation", "won", "lost", "on_hold"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(),
  actual_close_date: z.string().optional(),
  assigned_to: z.string().optional(),
  metadata: z.any().optional(),
})

// GET /admin/deals/:id - Get deal by ID
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamId = (req as any).team_id
  const query = req.scope.resolve(Modules.QUERY)

  try {
    // Fetch deal with related data
    const { data: deals } = await query.graph({
      entity: "deal",
      fields: [
        "*",
        "company.*",
        "contact.*",
        "portfolio.*",
        "scenarios.*",
        "scenarios.line_items.*",
      ],
      filters: { id },
    })

    if (!deals || deals.length === 0) {
      res.status(404).json({ error: "Deal not found" })
      return
    }

    const deal = deals[0]

    // Verify team ownership
    if (deal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    res.json({ deal })
  } catch (error) {
    console.error("Failed to fetch deal:", error)
    res.status(500).json({ error: "Failed to fetch deal" })
  }
}

// PATCH /admin/deals/:id - Update deal
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  // Validate input
  const validation = UpdateDealSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  try {
    // First, verify deal belongs to team
    const existingDeal = await dealModuleService.retrieveDeal(id)

    if (existingDeal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // Update deal
    const updateData: any = { id, ...validation.data }

    // Convert date strings to Date objects
    if (validation.data.expected_close_date) {
      updateData.expected_close_date = new Date(validation.data.expected_close_date)
    }
    if (validation.data.actual_close_date) {
      updateData.actual_close_date = new Date(validation.data.actual_close_date)
    }

    const deal = await dealModuleService.updateDeals(updateData)

    res.json({ deal })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update deal"
    res.status(400).json({ error: message })
  }
}

// DELETE /admin/deals/:id - Delete deal
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  try {
    // First, verify deal belongs to team
    const existingDeal = await dealModuleService.retrieveDeal(id)

    if (existingDeal.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Deal does not belong to your team" })
      return
    }

    // Soft delete deal
    await dealModuleService.softDeleteDeals([id])

    res.status(200).json({ success: true, id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete deal"
    res.status(400).json({ error: message })
  }
}
