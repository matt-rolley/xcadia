import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "@/modules/company"
import CompanyModuleService from "@/modules/company/service"

export type CreateCompanyStepInput = {
  team_id: string
  name: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  notes?: string
}

export const createCompanyStep = createStep(
  "create-company",
  async (input: CreateCompanyStepInput, { container }) => {
    const companyModuleService: CompanyModuleService = container.resolve(COMPANY_MODULE)

    const company = await companyModuleService.createCompanies({
      team_id: input.team_id,
      name: input.name,
      website: input.website || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      country: input.country || null,
      postal_code: input.postal_code || null,
      notes: input.notes || null,
    })

    return new StepResponse(company, { company_id: company.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const companyModuleService: CompanyModuleService = container.resolve(COMPANY_MODULE)

    // Rollback: delete the created company
    await companyModuleService.deleteCompanies(compensationData.company_id)
  }
)
