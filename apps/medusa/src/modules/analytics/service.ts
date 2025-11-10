import { MedusaService } from "@medusajs/framework/utils"
import AnalyticsEvent from "./models/analytics-event"

class AnalyticsModuleService extends MedusaService({
  AnalyticsEvent,
}) {}

export default AnalyticsModuleService
