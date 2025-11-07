import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createDealWorkflow } from "@/workflows/deal/create-deal"
import { DEAL_MODULE } from "@/modules/deal"
import { z } from "zod"

const CreateDealSchema = z.object({
  company_id: z.string(),
  contact_id: z.string().optional(),
  portfolio_id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  deal_type: z.enum(["project", "retainer", "consulting", "custom"]),
  stage: z.enum(["lead", "qualification", "proposal", "negotiation", "won", "lost", "on_hold"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(), // ISO date string
  currency: z.string().default("USD"),
  assigned_to: z.string().optional(),
  metadata: z.any().optional(),
})

// POST /admin/deals - Create a new deal
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const userId = (req as any).auth_context?.actor_id

  // Validate input
  const validation = CreateDealSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    // Execute workflow to create deal
    const { result } = await createDealWorkflow(req.scope).run({
      input: {
        team_id: teamId,
        created_by: userId,
        ...data,
      },
    })

    res.status(201).json({ deal: result.deal })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create deal"
    res.status(400).json({ error: message })
  }
}

// GET /admin/deals - List all deals for team
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const dealModuleService = req.scope.resolve(DEAL_MODULE)

  const {
    limit = 50,
    offset = 0,
    stage,
    deal_type,
    company_id,
  } = req.query

  try {
    const filters: any = { team_id: teamId }

    if (stage) filters.stage = stage
    if (deal_type) filters.deal_type = deal_type
    if (company_id) filters.company_id = company_id

    const deals = await dealModuleService.listDeals({
      filters,
      skip: Number(offset),
      take: Number(limit),
    })

    res.json({
      deals,
      pagination: {
        offset: Number(offset),
        limit: Number(limit),
        total: deals.length,
      },
    })
  } catch (error) {
    console.error("Failed to list deals:", error)
    res.status(500).json({ error: "Failed to list deals" })
  }
}
