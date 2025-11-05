import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { createProjectWorkflow } from "@/workflows/portfolio/create-project"

// GET /admin/projects - List all projects (filtered by team)
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)
  const teamId = (req as any).team_id

  const projects = await portfolioModuleService.listProjects({
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({ projects: Array.isArray(projects) ? projects : [projects] })
}

// POST /admin/projects - Create a new project
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { team_id, title, ...rest } = req.body as any

  if (!team_id || !title) {
    res.status(400).json({ error: "Missing required fields: team_id, title" })
    return
  }

  const { result } = await createProjectWorkflow(req.scope).run({
    input: { team_id, title, ...rest },
  })

  res.status(201).json({ project: result.project })
}
