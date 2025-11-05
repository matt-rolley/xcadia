import { MedusaService } from "@medusajs/framework/utils"
import Project from "./models/project"
import Portfolio from "./models/portfolio"
import PortfolioProject from "./models/portfolio-project"

class PortfolioModuleService extends MedusaService({
  Project,
  Portfolio,
  PortfolioProject,
}) {}

export default PortfolioModuleService
