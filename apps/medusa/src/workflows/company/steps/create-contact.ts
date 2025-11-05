import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "@/modules/company"
import CompanyModuleService from "@/modules/company/service"

export type CreateContactStepInput = {
  company_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  title?: string
  notes?: string
  is_primary?: boolean
}

export const createContactStep = createStep(
  "create-contact",
  async (input: CreateContactStepInput, { container }) => {
    const companyModuleService: CompanyModuleService = container.resolve(COMPANY_MODULE)

    const contact = await companyModuleService.createContacts({
      company_id: input.company_id,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone || null,
      title: input.title || null,
      notes: input.notes || null,
      is_primary: input.is_primary || false,
    })

    return new StepResponse(contact, { contact_id: contact.id })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const companyModuleService: CompanyModuleService = container.resolve(COMPANY_MODULE)

    // Rollback: delete the created contact
    await companyModuleService.deleteContacts(compensationData.contact_id)
  }
)
