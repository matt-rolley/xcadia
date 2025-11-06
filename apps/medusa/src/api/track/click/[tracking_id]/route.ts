import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { trackEmailEventWorkflow } from "@/workflows/email/track-email-event"

// GET /track/click/:tracking_id - Click tracking and redirect
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { tracking_id } = req.params
  const redirectUrl = req.query.url as string

  if (!redirectUrl) {
    res.status(400).json({ error: "Missing 'url' query parameter" })
    return
  }

  try {
    // Run tracking workflow asynchronously (don't block redirect)
    trackEmailEventWorkflow(req.scope).run({
      input: {
        tracking_id,
        event_type: "clicked",
        user_agent: req.headers["user-agent"] as string,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string,
        link_url: redirectUrl,
      },
    }).catch((error) => {
      // Log error but don't fail the redirect
      console.error("Failed to track email click:", error)
    })
  } catch (error) {
    // Silently fail - we still want to redirect the user
    console.error("Failed to track email click:", error)
  }

  // Redirect to the target URL
  res.redirect(302, redirectUrl)
}
