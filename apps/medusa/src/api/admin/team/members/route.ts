import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/team/members - List all team members
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Fetch team members with user details
    const { data: members } = await query.graph({
      entity: "team_member",
      fields: [
        "id",
        "role",
        "is_active",
        "created_at",
        "user_id",
        "user.email",
        "user.first_name",
        "user.last_name",
        "user.metadata",
      ],
      filters: { team_id: teamId },
    })

    // Transform for UI
    const transformedMembers = members.map((member: any) => ({
      id: member.id,
      email: member.user?.email || "N/A",
      name: member.user
        ? `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim() || member.user.email
        : "Unknown",
      role: member.role,
      is_active: member.is_active,
      last_login_at: member.user?.metadata?.last_login_at,
      created_at: member.created_at,
    }))

    res.json({
      members: transformedMembers,
    })
  } catch (error) {
    console.error("Failed to list team members:", error)
    res.status(500).json({ error: "Failed to list team members" })
  }
}
