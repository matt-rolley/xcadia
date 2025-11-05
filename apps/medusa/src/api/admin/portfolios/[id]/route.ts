import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/portfolios/:id - Get a single portfolio with linked data
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: portfolios } = await query.graph({
      entity: "portfolio",
      fields: [
        "*",
        "projects.*",
        "projects.portfolios.display_order",
      ],
      filters: { id },
    })

    if (!portfolios || portfolios.length === 0) {
      res.status(404).json({ error: "Portfolio not found" })
      return
    }

    res.json({ portfolio: portfolios[0] })
  } catch (error) {
    res.status(404).json({ error: "Portfolio not found" })
  }
}

// PATCH /admin/portfolios/:id - Update a portfolio
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)
  const { password, expires_at, ...data } = req.body as any

  try {
    const portfolio = await portfolioModuleService.updatePortfolioes({
      id,
      ...data,
      ...(password !== undefined && { password_hash: password || null }),
      ...(expires_at !== undefined && { expires_at: expires_at ? new Date(expires_at) : null }),
    })

    res.json({ portfolio })
  } catch (error) {
    res.status(404).json({ error: "Portfolio not found" })
  }
}

// DELETE /admin/portfolios/:id - Delete a portfolio (soft delete)
export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  try {
    await portfolioModuleService.softDeletePortfolioes([id])
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ error: "Portfolio not found" })
  }
}
