import { MedusaService } from "@medusajs/framework/utils"
import EmailTemplate from "./models/email-template"
import PortfolioEmail from "./models/portfolio-email"
import EmailEvent from "./models/email-event"

class EmailModuleService extends MedusaService({
  EmailTemplate,
  PortfolioEmail,
  EmailEvent,
}) {}

export default EmailModuleService
