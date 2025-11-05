import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"

// GET /admin/companies/:id - Get a single company
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const company = await companyModuleService.retrieveCompany(id)

  if (!company) {
    res.status(404).json({
      error: "Company not found",
    })
    return
  }

  res.json({
    company,
  })
}
