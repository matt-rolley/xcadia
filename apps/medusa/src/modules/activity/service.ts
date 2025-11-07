import { MedusaService } from "@medusajs/framework/utils"
import Activity from "./models/activity"

class ActivityModuleService extends MedusaService({
  Activity,
}) {}

export default ActivityModuleService
