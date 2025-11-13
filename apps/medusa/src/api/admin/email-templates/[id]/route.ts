import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/email-templates/:id - Get a single email template
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id
  const { id } = req.params

  if (!teamId) {
    res.status(403).json({
      message: "Team context required",
    })
    return
  }

  const { data: emailTemplates } = await query.graph({
    entity: "email_template",
    fields: ["*"],
    filters: {
      id,
      team_id: teamId,
    },
  })

  if (!emailTemplates || emailTemplates.length === 0) {
    res.status(404).json({
      message: "Email template not found",
    })
    return
  }

  res.json({
    email_template: emailTemplates[0],
  })
}

// POST /admin/email-templates/:id - Update an email template
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const emailModuleService = req.scope.resolve("emailModuleService")
  const teamId = (req as any).team_id
  const { id } = req.params

  if (!teamId) {
    res.status(403).json({
      message: "Team context required",
    })
    return
  }

  // Verify template exists and belongs to team
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existingTemplates } = await query.graph({
    entity: "email_template",
    fields: ["id", "team_id"],
    filters: {
      id,
      team_id: teamId,
    },
  })

  if (!existingTemplates || existingTemplates.length === 0) {
    res.status(404).json({
      message: "Email template not found",
    })
    return
  }

  try {
    const updatedTemplate = await emailModuleService.updateEmailTemplates(id, req.body)

    res.json({
      email_template: updatedTemplate,
    })
  } catch (error) {
    console.error("Update email template error:", error)
    res.status(500).json({
      message: "Failed to update email template",
      error: error.message,
    })
  }
}

// DELETE /admin/email-templates/:id - Delete an email template
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const emailModuleService = req.scope.resolve("emailModuleService")
  const teamId = (req as any).team_id
  const { id } = req.params

  if (!teamId) {
    res.status(403).json({
      message: "Team context required",
    })
    return
  }

  // Verify template exists and belongs to team
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existingTemplates } = await query.graph({
    entity: "email_template",
    fields: ["id", "team_id"],
    filters: {
      id,
      team_id: teamId,
    },
  })

  if (!existingTemplates || existingTemplates.length === 0) {
    res.status(404).json({
      message: "Email template not found",
    })
    return
  }

  try {
    await emailModuleService.deleteEmailTemplates(id)

    res.status(204).send()
  } catch (error) {
    console.error("Delete email template error:", error)
    res.status(500).json({
      message: "Failed to delete email template",
      error: error.message,
    })
  }
}
