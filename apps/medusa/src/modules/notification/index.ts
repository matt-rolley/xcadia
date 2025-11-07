import NotificationModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const IN_APP_NOTIFICATION_MODULE = "inAppNotificationModuleService"

export default Module(IN_APP_NOTIFICATION_MODULE, {
  service: NotificationModuleService,
})
