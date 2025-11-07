import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ACTIVITY_MODULE } from "@/modules/activity"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/activity - List activities for team with filters
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  // Get query parameters for filtering
  const {
    entity_type,
    entity_id,
    user_id,
    action,
    limit = 50,
    offset = 0,
    from_date,
    to_date,
  } = req.query

  // Build filters
  const filters: any = {}

  if (teamId) {
    filters.team_id = teamId
  }

  if (entity_type) {
    filters.entity_type = entity_type
  }

  if (entity_id) {
    filters.entity_id = entity_id
  }

  if (user_id) {
    filters.user_id = user_id
  }

  if (action) {
    filters.action = action
  }

  // Date range filtering
  if (from_date || to_date) {
    filters.occurred_at = {}
    if (from_date) {
      filters.occurred_at.$gte = new Date(from_date as string)
    }
    if (to_date) {
      filters.occurred_at.$lte = new Date(to_date as string)
    }
  }

  const { data: activities, metadata } = await query.graph({
    entity: "activity",
    fields: ["*"],
    filters,
    pagination: {
      skip: Number(offset),
      take: Number(limit),
      order: {
        occurred_at: "DESC",
      },
    },
  })

  res.json({
    activities,
    count: metadata?.count || activities.length,
    limit: Number(limit),
    offset: Number(offset),
  })
}
