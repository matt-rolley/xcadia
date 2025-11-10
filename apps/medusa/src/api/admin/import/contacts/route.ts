import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { csvImportContactsWorkflow } from "@/workflows/import/csv-import-contacts"
import { z } from "zod"

const importContactsSchema = z.object({
  file_content: z.string().min(1),
  mapping: z.record(z.string()),
  create_companies: z.boolean().default(true),
})

/**
 * POST /admin/import/contacts
 * Import contacts from CSV file
 *
 * Example request:
 * {
 *   "file_content": "Email,First Name,Last Name,Company,Phone\njohn@example.com,John,Doe,Acme Corp,555-1234",
 *   "mapping": {
 *     "Email": "email",
 *     "First Name": "first_name",
 *     "Last Name": "last_name",
 *     "Company": "company_name",
 *     "Phone": "phone"
 *   },
 *   "create_companies": true
 * }
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const user_id = req.auth_context?.actor_id

    if (!team_id || !user_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = importContactsSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    const { file_content, mapping, create_companies } = parsed.data

    // Execute CSV import workflow
    const { result } = await csvImportContactsWorkflow(req.scope).run({
      input: {
        team_id,
        user_id,
        file_content,
        mapping,
        create_companies,
      },
    })

    // Emit analytics event
    const eventBusService = req.scope.resolve("eventBusService")
    await eventBusService.emit("contact.imported", {
      team_id,
      user_id,
      total_rows: result.total_rows,
      successful: result.successful,
      failed: result.failed,
    })

    return res.status(result.failed > 0 ? 207 : 200).json({
      message: result.failed > 0
        ? `Import completed with ${result.failed} errors`
        : "Import completed successfully",
      import_id: result.import_id,
      status: result.status,
      summary: {
        total_rows: result.total_rows,
        successful: result.successful,
        failed: result.failed,
        contacts_created: result.contacts_created.length,
        companies_created: result.companies_created.length,
      },
      errors: result.errors,
      contacts: result.contacts_created.map((c: any) => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        company_id: c.company_id,
      })),
      companies: result.companies_created.map((c: any) => ({
        id: c.id,
        name: c.name,
      })),
    })
  } catch (error: any) {
    console.error("CSV import error:", error)
    return res.status(500).json({
      message: "CSV import failed",
      error: error.message,
    })
  }
}
