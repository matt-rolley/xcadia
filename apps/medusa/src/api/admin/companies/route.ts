import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"
import { createCompanyWorkflow } from "@/workflows/company/create-company"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PostAdminCreateCompany } from "./validators"

// GET /admin/companies - List all companies with linked data (filtered by team)
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  const { data: companies } = await query.graph({
    entity: "company",
    fields: [
      "*",
      "contacts.*",
    ],
    filters: teamId ? { team_id: teamId } : {},
  })

  res.json({ companies })
}

// POST /admin/companies - Create a new company
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Validate input with Zod
  const validation = PostAdminCreateCompany.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  // Execute workflow to create company
  const { result } = await createCompanyWorkflow(req.scope).run({
    input: data,
  })

  res.status(201).json({
    company: result.company,
  })
}
