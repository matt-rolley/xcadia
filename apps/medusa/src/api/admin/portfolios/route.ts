import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { createPortfolioWorkflow } from "@/workflows/portfolio/create-portfolio"

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
  const { team_id, title, slug, password, expires_at, ...rest } = req.body as any

  if (!team_id || !title || !slug) {
    res.status(400).json({ error: "Missing required fields: team_id, title, slug" })
    return
  }

  const { result } = await createPortfolioWorkflow(req.scope).run({
    input: {
      team_id,
      title,
      slug,
      ...rest,
      password_hash: password || undefined,
      expires_at: expires_at ? new Date(expires_at) : undefined,
    },
  })

  res.status(201).json({ portfolio: result.portfolio })
}
