import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import PortfolioModuleService from "@/modules/portfolio/service"

export type CreateProjectStepInput = {
  team_id: string
  company_id?: string
  title: string
  description?: string
  category?: string
  tags?: string[]
  is_featured?: boolean
  display_order?: number
  metadata?: Record<string, any>
}

export const createProjectStep = createStep(
  "create-project",
  async (input: CreateProjectStepInput, { container }) => {
    const portfolioModuleService: PortfolioModuleService = container.resolve(PORTFOLIO_MODULE)

    const project = await portfolioModuleService.createProjects({
      team_id: input.team_id,
      company_id: input.company_id || null,
      title: input.title,
      description: input.description || null,
      category: input.category || null,
      tags: input.tags ? (input.tags as any) : null,
      is_featured: input.is_featured || false,
      display_order: input.display_order || 0,
      metadata: input.metadata || null,
    })

    return new StepResponse(project, { project_id: project.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const portfolioModuleService: PortfolioModuleService = container.resolve(PORTFOLIO_MODULE)
    await portfolioModuleService.deleteProjects(compensationData.project_id)
  }
)
