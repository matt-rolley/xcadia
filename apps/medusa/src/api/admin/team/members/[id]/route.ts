import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { removeMemberWorkflow } from "@/workflows/team/remove-member"

// DELETE /admin/team/members/:id - Remove a team member
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const userId = (req as any).auth_context?.actor_id
  const memberId = req.params.id

  try {
    // Execute workflow to remove member
    await removeMemberWorkflow(req.scope).run({
      input: {
        team_id: teamId,
        member_id: memberId,
        removed_by: userId,
      },
    })

    res.json({ message: "Member removed successfully" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove member"
    res.status(400).json({ error: message })
  }
}
