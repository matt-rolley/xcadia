import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { createPortfolioWorkflow } from "@/workflows/portfolio/create-portfolio"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/portfolios - List all portfolios with linked data (filtered by team)
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  const { data: portfolios } = await query.graph({
    entity: "portfolio",
    fields: [
      "*",
      "projects.*",
      "projects.portfolios.display_order", // Access pivot table field
    ],
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({ portfolios })
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
