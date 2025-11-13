import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { sanitizeCSVValue } from "@/lib/data-sanitization"

type CsvImportInput = {
  team_id: string
  user_id: string
  file_content: string // CSV file content as string
  mapping: Record<string, string> // Column mapping: { "Email": "email", "First Name": "first_name" }
  create_companies: boolean // Auto-create companies if they don't exist
}

type CsvImportOutput = {
  import_id: string
  status: string
  total_rows: number
  successful: number
  failed: number
  errors: Array<{
    row: number
    data: any
    error: string
  }>
  contacts_created: any[]
  companies_created: any[]
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): any[] {
  const lines = content.split("\n").filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: any = {}

    headers.forEach((header, index) => {
      // Sanitize CSV values to prevent formula injection
      row[header] = sanitizeCSVValue(values[index] || "")
    })

    rows.push(row)
  }

  return rows
}

/**
 * Step 1: Parse and validate CSV data
 */
const parseCsvStep = createStep(
  "parse-csv",
  async ({ file_content, mapping }: { file_content: string; mapping: Record<string, string> }) => {
    const rows = parseCSV(file_content)

    // Map CSV columns to contact fields
    const mappedRows = rows.map((row) => {
      const mapped: any = {}
      Object.entries(mapping).forEach(([csvColumn, fieldName]) => {
        mapped[fieldName] = row[csvColumn] || null
      })
      return mapped
    })

    // Validate required fields
    const validatedRows: any[] = []
    const errors: any[] = []

    mappedRows.forEach((row, index) => {
      // Email is required
      if (!row.email || !row.email.includes("@")) {
        errors.push({
          row: index + 2, // +2 because row 1 is headers, and we're 0-indexed
          data: row,
          error: "Missing or invalid email address",
        })
        return
      }

      // First name or last name required
      if (!row.first_name && !row.last_name) {
        errors.push({
          row: index + 2,
          data: row,
          error: "Either first_name or last_name is required",
        })
        return
      }

      validatedRows.push(row)
    })

    return new StepResponse({ validatedRows, errors })
  }
)

/**
 * Step 2: Find or create companies
 */
const findOrCreateCompaniesStep = createStep(
  "find-or-create-companies",
  async (
    {
      team_id,
      validatedRows,
      create_companies,
    }: {
      team_id: string
      validatedRows: any[]
      create_companies: boolean
    },
    { container }
  ) => {
    const companyModuleService = container.resolve("companyModuleService")

    const companyMap = new Map<string, any>()
    const companiesCreated: any[] = []

    for (const row of validatedRows) {
      if (!row.company_name) continue

      const companyName = row.company_name.trim()

      // Check if we've already processed this company in this batch
      if (companyMap.has(companyName)) {
        row.company_id = companyMap.get(companyName).id
        continue
      }

      // Look up existing company by name
      const existingCompanies = await companyModuleService.listCompanies({
        filters: {
          team_id,
          name: companyName,
        },
        take: 1,
      })

      if (existingCompanies && existingCompanies.length > 0) {
        const company = existingCompanies[0]
        companyMap.set(companyName, company)
        row.company_id = company.id
      } else if (create_companies) {
        // Create new company
        const newCompany = await companyModuleService.createCompanies({
          team_id,
          name: companyName,
          website: row.company_website || null,
          industry: row.company_industry || null,
          size: row.company_size || null,
          location: row.company_location || null,
        })

        companyMap.set(companyName, newCompany)
        companiesCreated.push(newCompany)
        row.company_id = newCompany.id
      }
    }

    return new StepResponse(
      { validatedRows, companiesCreated },
      async () => {
        // Rollback: delete created companies
        for (const company of companiesCreated) {
          await companyModuleService.deleteCompanies(company.id)
        }
      }
    )
  }
)

/**
 * Step 3: Import contacts
 */
const importContactsStep = createStep(
  "import-contacts",
  async (
    {
      team_id,
      user_id,
      validatedRows,
    }: {
      team_id: string
      user_id: string
      validatedRows: any[]
    },
    { container }
  ) => {
    const companyModuleService = container.resolve("companyModuleService")

    const contactsCreated: any[] = []
    const errors: any[] = []

    for (let i = 0; i < validatedRows.length; i++) {
      const row = validatedRows[i]

      try {
        // Check for duplicate email
        const existingContacts = await companyModuleService.listContacts({
          filters: {
            team_id,
            email: row.email,
          },
          take: 1,
        })

        if (existingContacts && existingContacts.length > 0) {
          errors.push({
            row: i + 2,
            data: row,
            error: `Contact with email ${row.email} already exists`,
          })
          continue
        }

        // Create contact
        const contact = await companyModuleService.createContacts({
          team_id,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          email: row.email,
          phone: row.phone || null,
          job_title: row.job_title || null,
          company_id: row.company_id || null,
          linkedin_url: row.linkedin_url || null,
          twitter_url: row.twitter_url || null,
          location: row.location || null,
          notes: row.notes || null,
          tags: row.tags ? row.tags.split(";").map((t: string) => t.trim()) : null,
          metadata: {
            imported_by: user_id,
            imported_at: new Date().toISOString(),
          },
        })

        contactsCreated.push(contact)
      } catch (error: any) {
        errors.push({
          row: i + 2,
          data: row,
          error: error.message,
        })
      }
    }

    return new StepResponse(
      { contactsCreated, errors },
      async () => {
        // Rollback: delete created contacts
        for (const contact of contactsCreated) {
          await companyModuleService.deleteContacts(contact.id)
        }
      }
    )
  }
)

export const csvImportContactsWorkflow = createWorkflow(
  "csv-import-contacts",
  function (input: CsvImportInput): WorkflowResponse<CsvImportOutput> {
    // Parse CSV and validate
    const { validatedRows, errors: parseErrors } = parseCsvStep({
      file_content: input.file_content,
      mapping: input.mapping,
    })

    // Find or create companies
    const { validatedRows: rowsWithCompanies, companiesCreated } = findOrCreateCompaniesStep({
      team_id: input.team_id,
      validatedRows,
      create_companies: input.create_companies,
    })

    // Import contacts
    const { contactsCreated, errors: importErrors } = importContactsStep({
      team_id: input.team_id,
      user_id: input.user_id,
      validatedRows: rowsWithCompanies,
    })

    // Combine all errors
    const allErrors = [...parseErrors, ...importErrors]

    return new WorkflowResponse({
      import_id: `import_${Date.now()}`,
      status: allErrors.length === 0 ? "completed" : "completed_with_errors",
      total_rows: validatedRows.length + parseErrors.length,
      successful: contactsCreated.length,
      failed: allErrors.length,
      errors: allErrors,
      contacts_created: contactsCreated,
      companies_created: companiesCreated,
    })
  }
)
