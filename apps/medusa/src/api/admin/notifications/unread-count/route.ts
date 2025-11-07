import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"

// GET /admin/notifications/unread-count - Get unread count for badge
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const notificationService = req.scope.resolve(IN_APP_NOTIFICATION_MODULE)
  const userId = (req as any).auth_context?.actor_id
  const teamId = (req as any).team_id

  try {
    const unreadNotifications = await notificationService.listInAppNotifications({
      team_id: teamId,
      user_id: userId,
      read: false,
    })

    res.json({
      count: unreadNotifications.length,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to get unread count" })
  }
}
