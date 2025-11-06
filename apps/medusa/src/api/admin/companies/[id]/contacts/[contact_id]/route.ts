import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import CompanyModuleService from "@/modules/company/service"
import { COMPANY_MODULE } from "@/modules/company"

// GET /admin/companies/:id/contacts/:contact_id - Get a single contact
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { contact_id } = req.params
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  try {
    const contact = await companyModuleService.retrieveContact(contact_id)
    res.json({ contact })
  } catch (error) {
    res.status(404).json({ error: "Contact not found" })
  }
}

// PATCH /admin/companies/:id/contacts/:contact_id - Update a contact
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { contact_id } = req.params
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)
  const data = req.validatedBody as Record<string, any>

  try {
    const contact = await companyModuleService.updateContacts({
      id: contact_id,
      ...data,
    })

    res.json({ contact })
  } catch (error) {
    res.status(404).json({ error: "Contact not found" })
  }
}

// DELETE /admin/companies/:id/contacts/:contact_id - Delete a contact (soft delete)
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { contact_id } = req.params
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  try {
    await companyModuleService.softDeleteContacts([contact_id])
    res.status(204).send()
  } catch (error) {
    res.status(404).json({ error: "Contact not found" })
  }
}
