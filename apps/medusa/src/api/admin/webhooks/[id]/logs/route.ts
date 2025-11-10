import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/webhooks/[id]/logs
 * Get webhook delivery logs
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const webhook_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    // Verify team ownership
    const webhook = await webhookModuleService.retrieveWebhook(webhook_id)
    if (webhook.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    // Get logs with pagination
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const logs = await webhookModuleService.listWebhookLogs({
      filters: { webhook_id },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    })

    return res.json({
      logs,
      count: logs.length,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Get webhook logs error:", error)
    return res.status(500).json({
      message: "Failed to get webhook logs",
      error: error.message,
    })
  }
}
