import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const user_id = req.auth_context?.actor_id
    const current_token_hash = req.body.current_token_hash // Hash of current session token

    if (!user_id) {
      return res.status(401).json({
        message: "Authentication required",
      })
    }

    const securityModuleService = req.scope.resolve("securityModuleService")

    // Get all active sessions for user
    const sessions = await securityModuleService.listSessions({
      filters: {
        user_id,
        revoked: false,
      },
    })

    // Revoke all sessions except current
    let revokedCount = 0

    for (const session of sessions) {
      // Skip current session
      if (current_token_hash && session.token_hash === current_token_hash) {
        continue
      }

      await securityModuleService.updateSessions({
        id: session.id,
        revoked: true,
        revoked_at: new Date(),
        revoke_reason: "user_revoke_all",
      })

      revokedCount++
    }

    return res.json({
      message: `Revoked ${revokedCount} session(s)`,
      revoked_count: revokedCount,
    })
  } catch (error) {
    console.error("Revoke all sessions error:", error)
    return res.status(500).json({
      message: "Failed to revoke sessions",
      error: error.message,
    })
  }
}
