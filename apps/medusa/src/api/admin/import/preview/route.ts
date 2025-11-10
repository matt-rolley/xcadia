import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

const previewSchema = z.object({
  file_content: z.string().min(1),
  sample_rows: z.number().default(5),
})

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
      row[header] = values[index] || ""
    })

    rows.push(row)
  }

  return rows
}

/**
 * POST /admin/import/preview
 * Preview CSV file before importing
 *
 * Returns:
 * - Detected columns
 * - Sample rows
 * - Suggested field mapping
 * - Total row count
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = previewSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    const { file_content, sample_rows } = parsed.data

    // Parse CSV
    const rows = parseCSV(file_content)

    if (rows.length === 0) {
      return res.status(400).json({
        message: "CSV file is empty or invalid",
      })
    }

    // Get column headers
    const columns = Object.keys(rows[0])

    // Suggest field mapping based on column names
    const suggestedMapping: Record<string, string> = {}
    const fieldMappings: Record<string, string[]> = {
      email: ["email", "e-mail", "email address", "mail"],
      first_name: ["first name", "firstname", "first", "given name"],
      last_name: ["last name", "lastname", "last", "surname", "family name"],
      phone: ["phone", "telephone", "mobile", "cell", "phone number"],
      job_title: ["job title", "title", "position", "role"],
      company_name: ["company", "company name", "organization", "org"],
      company_website: ["website", "company website", "url", "web"],
      company_industry: ["industry", "sector", "company industry"],
      location: ["location", "city", "address", "country"],
      linkedin_url: ["linkedin", "linkedin url", "linkedin profile"],
      twitter_url: ["twitter", "twitter url", "twitter handle"],
      notes: ["notes", "description", "comments"],
    }

    columns.forEach((column) => {
      const lowerColumn = column.toLowerCase()
      for (const [field, patterns] of Object.entries(fieldMappings)) {
        if (patterns.some((pattern) => lowerColumn.includes(pattern))) {
          suggestedMapping[column] = field
          break
        }
      }
    })

    // Get sample rows
    const sampleData = rows.slice(0, sample_rows)

    // Detect potential issues
    const issues: string[] = []

    // Check if email column exists
    const hasEmailColumn = Object.values(suggestedMapping).includes("email")
    if (!hasEmailColumn) {
      issues.push("No email column detected - email is required for import")
    }

    // Check if name columns exist
    const hasFirstName = Object.values(suggestedMapping).includes("first_name")
    const hasLastName = Object.values(suggestedMapping).includes("last_name")
    if (!hasFirstName && !hasLastName) {
      issues.push("No name columns detected - at least first_name or last_name is required")
    }

    // Check for duplicates in sample
    const emails = sampleData.map((row) => {
      const emailColumn = Object.keys(suggestedMapping).find(
        (k) => suggestedMapping[k] === "email"
      )
      return emailColumn ? row[emailColumn] : null
    }).filter(Boolean)

    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index
    )
    if (duplicateEmails.length > 0) {
      issues.push(`Duplicate emails detected in sample: ${duplicateEmails.join(", ")}`)
    }

    return res.json({
      preview: {
        total_rows: rows.length,
        columns,
        suggested_mapping: suggestedMapping,
        sample_data: sampleData,
        issues,
      },
    })
  } catch (error: any) {
    console.error("CSV preview error:", error)
    return res.status(500).json({
      message: "Failed to preview CSV",
      error: error.message,
    })
  }
}
