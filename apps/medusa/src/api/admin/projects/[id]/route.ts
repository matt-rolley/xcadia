import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PortfolioModuleService from "@/modules/portfolio/service"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"

// GET /admin/projects/:id - Get a single project
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  try {
    const project = await portfolioModuleService.retrieveProject(id)
    res.json({ project })
  } catch (error) {
    res.status(404).json({ error: "Project not found" })
  }
}

// PATCH /admin/projects/:id - Update a project
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const portfolioModuleService: PortfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)
  const data = req.body as any

  try {
    const project = await portfolioModuleService.updateProjects({
      id,
      ...data,
      ...(data.tags && { tags: data.tags as any }),
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
