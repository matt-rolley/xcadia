import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { inviteMemberWorkflow } from "@/workflows/team/invite-member"
import { z } from "zod"

const InviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
})

// POST /admin/team/invite - Invite a new team member
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const userId = (req as any).auth_context?.actor_id

  // Validate input
  const validation = InviteMemberSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    // Execute workflow to invite member
    const { result } = await inviteMemberWorkflow(req.scope).run({
      input: {
        team_id: teamId,
        email: data.email,
        role: data.role,
        invited_by: userId,
      },
    })

    res.status(201).json({ invite: result.invite })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to invite member"
    res.status(400).json({ error: message })
  }
}
