import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { createProjectWorkflow } from "@/workflows/portfolio/create-project"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PostAdminCreateProject } from "./validators"

// GET /admin/projects - List all projects with linked data (filtered by team)
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  const { data: projects } = await query.graph({
    entity: "project",
    fields: [
      "*",
      "portfolios.*",
      "portfolios.projects.display_order", // Access pivot table field
    ],
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({ projects })
}

// POST /admin/projects - Create a new project
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  // Validate input with Zod
  const validation = PostAdminCreateProject.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  const { result } = await createProjectWorkflow(req.scope).run({
    input: data,
  })

  res.status(201).json({ project: result.project })
}
