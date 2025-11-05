import { MedusaService } from "@medusajs/framework/utils"
import Company from "./models/company"
import Contact from "./models/contact"

class CompanyModuleService extends MedusaService({
  Company,
  Contact,
}) {}

export default CompanyModuleService
