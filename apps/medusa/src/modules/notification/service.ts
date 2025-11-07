import { MedusaService } from "@medusajs/framework/utils"
import InAppNotification from "./models/in-app-notification"

class NotificationModuleService extends MedusaService({
  InAppNotification,
}) {}

export default NotificationModuleService
