import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { inviteMemberWorkflow } from "@/workflows/team/invite-member"
import { removeMemberWorkflow } from "@/workflows/team/remove-member"

// POST /admin/teams/:id/members - Invite a member to a team
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: team_id } = req.params
  const { inviter_user_id, invited_user_id, invited_user_email, role } = req.body as {
    inviter_user_id: string
    invited_user_id: string
    invited_user_email: string
    role?: "member" | "owner"
  }

  // Validate input
  if (!inviter_user_id || !invited_user_id || !invited_user_email) {
    res.status(400).json({
      error: "Missing required fields: inviter_user_id, invited_user_id, invited_user_email",
    })
    return
  }

  // Execute workflow to invite member
  const { result } = await inviteMemberWorkflow(req.scope).run({
    input: {
      team_id,
      inviter_user_id,
      invited_user_id,
      invited_user_email,
      role: role || "member",
    },
  })

  res.status(201).json({
    teamMember: result.teamMember,
  })
}

// DELETE /admin/teams/:id/members/:user_id - Remove a member from a team
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: team_id, user_id } = req.params
  const { remover_user_id } = req.body as {
    remover_user_id: string
  }

  // Validate input
  if (!remover_user_id) {
    res.status(400).json({
      error: "Missing required field: remover_user_id",
    })
    return
  }

  // Execute workflow to remove member
  const { result } = await removeMemberWorkflow(req.scope).run({
    input: {
      team_id,
      remover_user_id,
      user_id_to_remove: user_id,
    },
  })

  res.status(200).json({
    success: result.removed,
  })
}
