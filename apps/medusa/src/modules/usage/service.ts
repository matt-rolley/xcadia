import { MedusaService } from "@medusajs/framework/utils"
import UsageTracker from "./models/usage-tracker"

class UsageModuleService extends MedusaService({
  UsageTracker,
}) {}

export default UsageModuleService
