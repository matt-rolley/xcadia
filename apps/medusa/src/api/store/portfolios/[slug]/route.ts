import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import bcrypt from "bcrypt"

// GET /store/portfolios/:slug - Public portfolio viewer
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { slug } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  // Find portfolio by slug
  const portfolios = await portfolioModuleService.listPortfolioes({
    filters: { slug },
  })

  const portfolio = Array.isArray(portfolios) ? portfolios[0] : portfolios

  if (!portfolio) {
    res.status(404).json({ error: "Portfolio not found" })
    return
  }

  // Check if portfolio is active
  if (!portfolio.is_active) {
    res.status(403).json({ error: "Portfolio is not available" })
    return
  }

  // Check if portfolio has expired
  if (portfolio.expires_at && new Date(portfolio.expires_at) < new Date()) {
    res.status(403).json({ error: "Portfolio has expired" })
    return
  }

  // Check password protection with bcrypt
  if (portfolio.password_hash) {
    // Only accept password in POST body (not query string to avoid logging)
    const password = (req.body as any)?.password

    if (!password) {
      res.status(401).json({
        error: "Password required. Use POST with password in body.",
        requires_password: true,
      })
      return
    }

    try {
      const isValid = await bcrypt.compare(password, portfolio.password_hash)
      if (!isValid) {
        res.status(401).json({
          error: "Invalid password",
          requires_password: true,
        })
        return
      }
    } catch (error) {
      res.status(401).json({
        error: "Invalid password",
        requires_password: true,
      })
      return
    }
  }

  // Increment view count
  await portfolioModuleService.updatePortfolioes({
    id: portfolio.id,
    view_count: portfolio.view_count + 1,
  })

  res.json({ portfolio })
}

// POST /store/portfolios/:slug - Public portfolio viewer with password in body
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  // Reuse GET logic - POST allows sending password in body for security
  return GET(req, res)
}
