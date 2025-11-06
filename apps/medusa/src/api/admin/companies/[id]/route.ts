import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PatchAdminUpdateCompany } from "@/api/admin/companies/validators"

// GET /admin/companies/:id - Get a single company with linked data
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: companies } = await query.graph({
      entity: "company",
      fields: [
        "*",
        "contacts.*",
      ],
      filters: { id },
    })

    if (!companies || companies.length === 0) {
      res.status(404).json({ error: "Company not found" })
      return
    }

    res.json({ company: companies[0] })
  } catch (error) {
    res.status(404).json({ error: "Company not found" })
  }
}

// PATCH /admin/companies/:id - Update a company
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamId = (req as any).team_id
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  // Validate input with Zod
  const validation = PatchAdminUpdateCompany.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  try {
    // First, verify the company belongs to the user's team
    const existing = await companyModuleService.retrieveCompany(id)

    if (existing.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Company does not belong to your team" })
      return
    }

    const company = await companyModuleService.updateCompanies({
      id,
      ...data,
    })

    res.json({ company })
  } catch (error) {
    res.status(404).json({ error: "Company not found" })
  }
}

// DELETE /admin/companies/:id - Delete a company (soft delete)
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const teamId = (req as any).team_id
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  try {
    // First, verify the company belongs to the user's team
    const existing = await companyModuleService.retrieveCompany(id)

    if (existing.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Company does not belong to your team" })
      return
    }

    await companyModuleService.softDeleteCompanies([id])
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ error: "Company not found" })
  }
}
