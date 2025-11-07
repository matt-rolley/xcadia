import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"

// POST /admin/notifications/read-all - Mark all notifications as read
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const notificationService = req.scope.resolve(IN_APP_NOTIFICATION_MODULE)
  const userId = (req as any).auth_context?.actor_id
  const teamId = (req as any).team_id

  try {
    // Get count of unread notifications for response
    const unreadNotifications = await notificationService.listInAppNotifications({
      team_id: teamId,
      user_id: userId,
      read: false,
    })

    const count = unreadNotifications.length

    // Bulk update all unread notifications
    if (count > 0) {
      await notificationService.updateInAppNotifications(
        {
          team_id: teamId,
          user_id: userId,
          read: false,
        },
        {
          read: true,
          read_at: new Date(),
        }
      )
    }

    res.json({
      message: `Marked ${count} notifications as read`,
      count,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" })
  }
}
