import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { exportTeamDataWorkflow } from "@/workflows/gdpr/export-team-data"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get team_id and user_id from auth context
    const team_id = req.auth_context?.team_id || req.body.team_id
    const requested_by = req.auth_context?.actor_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Execute GDPR export workflow
    const { result } = await exportTeamDataWorkflow(req.scope).run({
      input: {
        team_id,
        requested_by,
      },
    })

    // In production, this would:
    // 1. Create a background job
    // 2. Generate ZIP file
    // 3. Upload to temporary storage
    // 4. Email download link
    // 5. Auto-delete after 7 days

    return res.json({
      message: "Data export completed",
      export_id: result.export_id,
      status: result.status,
      data: result.data,
      // In production:
      // download_url: "https://...",
      // expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.error("GDPR export error:", error)
    return res.status(500).json({
      message: "Data export failed",
      error: error.message,
    })
  }
}
