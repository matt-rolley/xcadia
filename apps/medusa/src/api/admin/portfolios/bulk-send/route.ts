import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { bulkSendPortfolioWorkflow } from "@/workflows/bulk/bulk-send-portfolio"
import { z } from "zod"

// Validation schema
const bulkSendSchema = z.object({
  portfolio_id: z.string().min(1, "Portfolio ID is required"),
  contact_ids: z.array(z.string()).min(1, "At least one contact is required"),
  subject_template: z.string().min(1, "Subject template is required"),
  message_template: z.string().min(1, "Message template is required"),
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Validate request body
    const parsed = bulkSendSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid bulk send data",
        errors: parsed.error.errors,
      })
    }

    // Get team_id and user_id from auth context
    const team_id = req.auth_context?.team_id || req.body.team_id
    const sender_id = req.auth_context?.actor_id || req.body.user_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Execute bulk send workflow
    const { result } = await bulkSendPortfolioWorkflow(req.scope).run({
      input: {
        team_id,
        portfolio_id: parsed.data.portfolio_id,
        contact_ids: parsed.data.contact_ids,
        subject_template: parsed.data.subject_template,
        message_template: parsed.data.message_template,
        sender_id,
      },
    })

    return res.json({
      message: `Sent to ${result.sent_count} contacts`,
      sent_count: result.sent_count,
      failed_count: result.failed_count,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Bulk send error:", error)
    return res.status(500).json({
      message: "Bulk send failed",
      error: error.message,
    })
  }
}
