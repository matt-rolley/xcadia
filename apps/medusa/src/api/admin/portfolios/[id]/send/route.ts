import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendPortfolioWorkflow } from "@/workflows/email/send-portfolio"
import { z } from "zod"

const PostAdminSendPortfolio = z.object({
  contact_ids: z.array(z.string()).min(1, "At least one contact is required"),
  subject: z.string().optional(),
  custom_message: z.string().optional(),
})

// POST /admin/portfolios/:id/send - Send portfolio to contact(s)
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: portfolio_id } = req.params
  const teamId = (req as any).team_id

  // Validate input with Zod
  const validation = PostAdminSendPortfolio.safeParse(req.body)

  if (!validation.success) {
    res.status(400).json({
      error: "Validation failed",
      details: validation.error.issues,
    })
    return
  }

  const { contact_ids, subject, custom_message } = validation.data

  try {
    // Execute workflow to send portfolio
    const { result } = await sendPortfolioWorkflow(req.scope).run({
      input: {
        portfolio_id,
        contact_ids,
        team_id: teamId,
        subject,
        custom_message,
      },
    })

    res.status(200).json({
      success: true,
      sent_count: result.sent_emails.length,
      sent_emails: result.sent_emails,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send portfolio"
    res.status(400).json({ error: message })
  }
}
