import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const user_id = req.auth_context?.actor_id

    if (!user_id) {
      return res.status(401).json({
        message: "Authentication required",
      })
    }

    const securityModuleService = req.scope.resolve("securityModuleService")

    // Get session to verify ownership
    const session = await securityModuleService.retrieveSession(id)

    // Verify session belongs to current user
    if (session.user_id !== user_id) {
      return res.status(404).json({
        message: "Session not found",
      })
    }

    // Revoke session
    await securityModuleService.updateSessions({
      id,
      revoked: true,
      revoked_at: new Date(),
      revoke_reason: "user_logout",
    })

    return res.status(204).send()
  } catch (error) {
    console.error("Revoke session error:", error)
    return res.status(500).json({
      message: "Failed to revoke session",
      error: error.message,
    })
  }
}
