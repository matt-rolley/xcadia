import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get user_id from auth context
    const user_id = req.auth_context?.actor_id

    if (!user_id) {
      return res.status(401).json({
        message: "Authentication required",
      })
    }

    const securityModuleService = req.scope.resolve("securityModuleService")

    // Get all active (non-revoked, non-expired) sessions for user
    const now = new Date()

    const sessions = await securityModuleService.listSessions({
      filters: {
        user_id,
        revoked: false,
        expires_at: { $gt: now },
      },
      order: { last_activity: "DESC" },
    })

    // Parse and format session data
    const formattedSessions = sessions.map((session: any) => ({
      id: session.id,
      device: session.device || "Unknown Device",
      ip_address: session.ip_address,
      last_activity: session.last_activity,
      created_at: session.created_at,
      expires_at: session.expires_at,
      is_current: false, // TODO: Check if this is the current session
    }))

    return res.json({
      sessions: formattedSessions,
      count: formattedSessions.length,
    })
  } catch (error) {
    console.error("List sessions error:", error)
    return res.status(500).json({
      message: "Failed to list sessions",
      error: error.message,
    })
  }
}
