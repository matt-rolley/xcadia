import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"
import { createContactWorkflow } from "@/workflows/company/create-contact"

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
  const { first_name, last_name, email, phone, title, notes, is_primary } = req.body as {
    first_name: string
    last_name: string
    email: string
    phone?: string
    title?: string
    notes?: string
    is_primary?: boolean
  }

  // Validate input
  if (!first_name || !last_name || !email) {
    res.status(400).json({
      error: "Missing required fields: first_name, last_name, email",
    })
    return
  }

  // Execute workflow to create contact
  const { result } = await createContactWorkflow(req.scope).run({
    input: {
      company_id,
      first_name,
      last_name,
      email,
      phone,
      title,
      notes,
      is_primary,
    },
  })

  res.status(201).json({
    contact: result.contact,
  })
}
