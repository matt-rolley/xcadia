import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"

// GET /admin/portfolios - List all portfolios (filtered by team)
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)
  const teamId = (req as any).team_id

  const portfolios = await portfolioModuleService.listPortfolioes({
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({ portfolios: Array.isArray(portfolios) ? portfolios : [portfolios] })
}

// POST /admin/portfolios - Create a new portfolio
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)
  const { team_id, contact_id, title, description, slug, password_hash, expires_at, is_active, metadata } = req.body as any

  if (!team_id || !title || !slug) {
    res.status(400).json({ error: "Missing required fields: team_id, title, slug" })
    return
  }

  const portfolio = await portfolioModuleService.createPortfolioes({
    team_id,
    contact_id: contact_id || null,
    title,
    description: description || null,
    slug,
    password_hash: password_hash || null,
    expires_at: expires_at || null,
    is_active: is_active !== undefined ? is_active : true,
    view_count: 0,
    metadata: metadata || null,
  })

  res.status(201).json({ portfolio })
}
