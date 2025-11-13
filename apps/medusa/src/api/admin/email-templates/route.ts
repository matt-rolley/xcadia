import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/email-templates - List email templates for team
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  if (!teamId) {
    res.status(403).json({
      message: "Team context required",
    })
    return
  }

  const { is_active, name, limit = 50, offset = 0 } = req.query

  // Build filters
  const filters: any = { team_id: teamId }

  if (is_active !== undefined) {
    filters.is_active = is_active === "true"
  }

  if (name) {
    filters.name = { $ilike: `%${name}%` }
  }

  const { data: emailTemplates, metadata } = await query.graph({
    entity: "email_template",
    fields: ["*"],
    filters,
    pagination: {
      skip: Number(offset),
      take: Number(limit),
      order: {
        updated_at: "DESC",
      },
    },
  })

  res.json({
    email_templates: emailTemplates,
    count: metadata?.count || emailTemplates.length,
    limit: Number(limit),
    offset: Number(offset),
  })
}

// POST /admin/email-templates - Create a new email template
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const emailModuleService = req.scope.resolve("emailModuleService")
  const teamId = (req as any).team_id

  if (!teamId) {
    res.status(403).json({
      message: "Team context required",
    })
    return
  }

  const {
    name,
    subject,
    html_content,
    text_content,
    variables,
    is_active = true,
  } = req.body

  // Validation
  if (!name || !subject || !html_content) {
    res.status(400).json({
      message: "Name, subject, and html_content are required",
    })
    return
  }

  try {
    const template = await emailModuleService.createEmailTemplates({
      team_id: teamId,
      name,
      subject,
      html_content,
      text_content: text_content || null,
      variables: variables || {},
      is_active,
    })

    res.status(201).json({
      email_template: template,
    })
  } catch (error) {
    console.error("Create email template error:", error)
    res.status(500).json({
      message: "Failed to create email template",
      error: error.message,
    })
  }
}
