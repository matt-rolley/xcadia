import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"

// PATCH /admin/notifications/:id/read - Mark notification as read
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const notificationService = req.scope.resolve(IN_APP_NOTIFICATION_MODULE)
  const notificationId = req.params.id
  const userId = (req as any).auth_context?.actor_id

  try {
    // Verify notification belongs to user
    const [notification] = await notificationService.listInAppNotifications({
      filters: {
        id: notificationId,
        user_id: userId,
      },
    })

    if (!notification) {
      res.status(404).json({ error: "Notification not found" })
      return
    }

    // Mark as read
    const updated = await notificationService.updateInAppNotifications({
      id: notificationId,
      read: true,
      read_at: new Date(),
    })

    res.json({ notification: updated })
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" })
  }
}
