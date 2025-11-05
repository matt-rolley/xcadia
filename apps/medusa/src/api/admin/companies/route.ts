import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"
import { createCompanyWorkflow } from "@/workflows/company/create-company"

// GET /admin/companies - List all companies (filtered by team)
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)
  const teamId = (req as any).team_id

  // Filter companies by team_id for multi-tenancy
  const companies = await companyModuleService.listCompanies({
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({
    companies: Array.isArray(companies) ? companies : [companies],
  })
}

// POST /admin/companies - Create a new company
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const {
    team_id,
    name,
    website,
    phone,
    email,
    address,
    city,
    state,
    country,
    postal_code,
    notes,
  } = req.body as {
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

  // Validate input
  if (!team_id || !name) {
    res.status(400).json({
      error: "Missing required fields: team_id, name",
    })
    return
  }

  // Execute workflow to create company
  const { result } = await createCompanyWorkflow(req.scope).run({
    input: {
      team_id,
      name,
      website,
      phone,
      email,
      address,
      city,
      state,
      country,
      postal_code,
      notes,
    },
  })

  res.status(201).json({
    company: result.company,
  })
}
