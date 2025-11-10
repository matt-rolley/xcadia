import { MedusaService } from "@medusajs/framework/utils"
import EmailDomain from "./models/email-domain"

class EmailDomainModuleService extends MedusaService({
  EmailDomain,
}) {}

export default EmailDomainModuleService
