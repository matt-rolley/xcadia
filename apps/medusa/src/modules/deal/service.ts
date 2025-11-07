import { MedusaService } from "@medusajs/framework/utils"
import Deal from "./models/deal"
import DealScenario from "./models/deal-scenario"
import DealLineItem from "./models/deal-line-item"

class DealModuleService extends MedusaService({
  Deal,
  DealScenario,
  DealLineItem,
}) {}

export default DealModuleService
