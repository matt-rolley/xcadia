import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"

// POST /admin/notifications/read-all - Mark all notifications as read
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const notificationService = req.scope.resolve(IN_APP_NOTIFICATION_MODULE)
  const userId = (req as any).auth_context?.actor_id
  const teamId = (req as any).team_id

  try {
    // Get all unread notifications for user
    const unreadNotifications = await notificationService.listInAppNotifications({
      filters: {
        team_id: teamId,
        user_id: userId,
        read: false,
      },
    })

    // Mark all as read
    const updates = unreadNotifications.map((notification: any) =>
      notificationService.updateInAppNotifications({
        id: notification.id,
        read: true,
        read_at: new Date(),
      })
    )

    await Promise.all(updates)

    res.json({
      message: `Marked ${unreadNotifications.length} notifications as read`,
      count: unreadNotifications.length,
    })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" })
  }
}
