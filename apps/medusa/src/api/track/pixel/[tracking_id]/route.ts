import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { trackEmailEventWorkflow } from "@/workflows/email/track-email-event"

// GET /track/pixel/:tracking_id.gif - Email open tracking pixel
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { tracking_id } = req.params

  // Remove .gif extension if present
  const cleanTrackingId = tracking_id.replace(/\.gif$/, "")

  try {
    // Run tracking workflow asynchronously (don't block response)
    trackEmailEventWorkflow(req.scope).run({
      input: {
        tracking_id: cleanTrackingId,
        event_type: "opened",
        user_agent: req.headers["user-agent"] as string,
        ip_address: req.ip || req.headers["x-forwarded-for"] as string,
      },
    }).catch((error) => {
      // Log error but don't fail the request
      console.error("Failed to track email open:", error)
    })
  } catch (error) {
    // Silently fail - we don't want to break email rendering
    console.error("Failed to track email open:", error)
  }

  // Return 1x1 transparent GIF
  const transparentGif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  )

  res.setHeader("Content-Type", "image/gif")
  res.setHeader("Content-Length", transparentGif.length.toString())
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
  res.setHeader("Pragma", "no-cache")
  res.status(200).send(transparentGif)
}
