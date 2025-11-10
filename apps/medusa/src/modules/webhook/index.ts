import { Module } from "@medusajs/framework/utils"
import WebhookModuleService from "./service"

export const WEBHOOK_MODULE = "webhookModuleService"

export default Module(WEBHOOK_MODULE, {
  service: WebhookModuleService,
})
