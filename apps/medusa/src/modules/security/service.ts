import { MedusaService } from "@medusajs/framework/utils"
import Session from "./models/session"
import Consent from "./models/consent"

class SecurityModuleService extends MedusaService({
  Session,
  Consent,
}) {}

export default SecurityModuleService
