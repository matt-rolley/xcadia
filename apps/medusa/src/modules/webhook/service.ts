import { MedusaService } from "@medusajs/framework/utils"
import Webhook from "./models/webhook"
import WebhookLog from "./models/webhook-log"

class WebhookModuleService extends MedusaService({
  Webhook,
  WebhookLog,
}) {}

export default WebhookModuleService
