import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"
import { createContactWorkflow } from "@/workflows/company/create-contact"
import { PostAdminCreateContact } from "@/api/admin/companies/validators"

// GET /admin/companies/:id/contacts - List all contacts for a company
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: company_id } = req.params
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const contacts = await companyModuleService.listContacts({
    filters: {
      company_id,
    },
  })

  res.json({
    contacts: Array.isArray(contacts) ? contacts : [contacts],
  })
}

// POST /admin/companies/:id/contacts - Create a new contact for a company
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: company_id } = req.params

  // Validate input with Zod
  const validation = PostAdminCreateContact.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const data = validation.data

  // Execute workflow to create contact
  const { result } = await createContactWorkflow(req.scope).run({
    input: {
      company_id,
      ...data,
    },
  })

  res.status(201).json({
    contact: result.contact,
  })
}
