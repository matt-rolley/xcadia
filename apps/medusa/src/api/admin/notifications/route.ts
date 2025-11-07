import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/notifications - List user's notifications (unread first)
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const userId = (req as any).auth_context?.actor_id
  const teamId = (req as any).team_id

  const { limit = 50, offset = 0, read } = req.query

  const filters: any = {
    team_id: teamId,
    user_id: userId,
  }

  // Filter by read status if specified
  if (read !== undefined) {
    filters.read = read === "true"
  }

  const { data: notifications, metadata } = await query.graph({
    entity: "in_app_notification",
    fields: ["*"],
    filters,
    pagination: {
      skip: Number(offset),
      take: Number(limit),
      order: {
        // Unread first, then by creation date
        read: "ASC",
        created_at: "DESC",
      },
    },
  })

  res.json({
    notifications,
    count: metadata?.count || notifications.length,
    limit: Number(limit),
    offset: Number(offset),
  })
}
