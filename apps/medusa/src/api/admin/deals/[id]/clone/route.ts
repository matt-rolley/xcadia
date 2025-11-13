import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cloneDealWorkflow } from "@/workflows/deal/clone-deal"
import { z } from "zod"

const CloneDealSchema = z.object({
  name: z.string().optional(), // Optional: override the cloned deal name
  company_id: z.string().optional(), // Optional: assign to different company
  contact_id: z.string().optional(), // Optional: assign to different contact
  assigned_to: z.string().optional(), // Optional: assign to different user
})

// POST /admin/deals/:id/clone - Clone an existing deal
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const userId = (req as any).auth_context?.actor_id
  const dealId = req.params.id

  // Validate input
  const validation = CloneDealSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    // Execute workflow to clone deal
    const { result } = await cloneDealWorkflow(req.scope).run({
      input: {
        deal_id: dealId,
        team_id: teamId,
        created_by: userId,
        ...data,
      },
    })

    res.status(201).json({
      deal: result.deal,
      scenarios: result.scenarios,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clone deal"
    res.status(400).json({ error: message })
  }
}
