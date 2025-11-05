import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import PortfolioModuleService from "@/modules/portfolio/service"

export type CreatePortfolioStepInput = {
  team_id: string
  contact_id?: string
  title: string
  description?: string
  slug: string
  password_hash?: string
  expires_at?: Date
  is_active?: boolean
  metadata?: Record<string, any>
}

export const createPortfolioStep = createStep(
  "create-portfolio",
  async (input: CreatePortfolioStepInput, { container }) => {
    const portfolioModuleService: PortfolioModuleService = container.resolve(PORTFOLIO_MODULE)

    const portfolio = await portfolioModuleService.createPortfolioes({
      team_id: input.team_id,
      contact_id: input.contact_id || null,
      title: input.title,
      description: input.description || null,
      slug: input.slug,
      password_hash: input.password_hash || null,
      expires_at: input.expires_at || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      view_count: 0,
      metadata: input.metadata || null,
    })

    return new StepResponse(portfolio, { portfolio_id: portfolio.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const portfolioModuleService: PortfolioModuleService = container.resolve(PORTFOLIO_MODULE)
    await portfolioModuleService.deletePortfolioes(compensationData.portfolio_id)
  }
)
