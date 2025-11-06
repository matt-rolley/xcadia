import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PatchAdminUpdateProject } from "@/api/admin/projects/validators"

// GET /admin/projects/:id - Get a single project with linked data
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: projects } = await query.graph({
      entity: "project",
      fields: [
        "*",
        "portfolios.*",
        "portfolios.projects.display_order",
      ],
      filters: { id },
    })

    if (!projects || projects.length === 0) {
      res.status(404).json({ error: "Project not found" })
      return
    }

    res.json({ project: projects[0] })
  } catch (error) {
    res.status(404).json({ error: "Project not found" })
  }
}

// PATCH /admin/projects/:id - Update a project
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  // Validate input with Zod
  const validation = PatchAdminUpdateProject.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    const project = await portfolioModuleService.updateProjects({
      id,
      ...data,
    })

    res.json({ project })
  } catch (error) {
    res.status(404).json({ error: "Project not found" })
  }
}

// DELETE /admin/projects/:id - Delete a project (soft delete)
export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  try {
    await portfolioModuleService.softDeleteProjects([id])
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ error: "Project not found" })
  }
}
