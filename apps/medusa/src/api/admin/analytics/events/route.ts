import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/analytics/events
 * Get raw analytics events with filtering
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const analyticsModuleService = req.scope.resolve("analyticsModuleService")

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 100
    const offset = parseInt(req.query.offset as string) || 0
    const event_type = req.query.event_type as string
    const event_category = req.query.event_category as string
    const user_id = req.query.user_id as string
    const entity_id = req.query.entity_id as string

    // Build filters
    const filters: any = { team_id }

    if (event_type) {
      filters.event_type = event_type
    }

    if (event_category) {
      filters.event_category = event_category
    }

    if (user_id) {
      filters.user_id = user_id
    }

    if (entity_id) {
      filters.entity_id = entity_id
    }

    // Date range filtering
    if (req.query.start_date) {
      filters.created_at = filters.created_at || {}
      filters.created_at.$gte = new Date(req.query.start_date as string)
    }

    if (req.query.end_date) {
      filters.created_at = filters.created_at || {}
      filters.created_at.$lte = new Date(req.query.end_date as string)
    }

    const events = await analyticsModuleService.listAnalyticsEvents({
      filters,
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    })

    return res.json({
      events,
      count: events.length,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Get analytics events error:", error)
    return res.status(500).json({
      message: "Failed to get analytics events",
      error: error.message,
    })
  }
}
