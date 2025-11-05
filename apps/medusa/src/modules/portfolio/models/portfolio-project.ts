import { model } from "@medusajs/framework/utils"

// Many-to-many relationship between Portfolio and Project
const PortfolioProject = model.define("portfolio_project", {
  id: model.id().primaryKey(),
  portfolio_id: model.text(),
  project_id: model.text(),
  display_order: model.number().default(0), // Custom order within portfolio
})

export default PortfolioProject
