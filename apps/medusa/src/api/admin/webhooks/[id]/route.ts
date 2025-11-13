import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { validateWebhookUrl } from "@/lib/webhook-security"

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  secret: z.string().optional(),
  auth_type: z.enum(["none", "bearer", "basic", "custom"]).optional(),
  auth_config: z.record(z.any()).optional(),
  enabled: z.boolean().optional(),
  retry_config: z.object({
    max_retries: z.number(),
    retry_delay: z.number(),
    backoff_multiplier: z.number(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * GET /admin/webhooks/[id]
 * Get webhook by ID
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const webhook_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    const webhook = await webhookModuleService.retrieveWebhook(webhook_id)

    // Verify team ownership
    if (webhook.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    return res.json({
      webhook: {
        ...webhook,
        secret: webhook.secret ? "***REDACTED***" : null,
        auth_config: webhook.auth_config ? "***REDACTED***" : null,
      },
    })
  } catch (error: any) {
    console.error("Get webhook error:", error)
    return res.status(500).json({
      message: "Failed to get webhook",
      error: error.message,
    })
  }
}

/**
 * PUT /admin/webhooks/[id]
 * Update webhook
 */
export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const webhook_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = updateWebhookSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    // Validate webhook URL for SSRF protection if URL is being updated
    if (parsed.data.url) {
      const urlValidation = validateWebhookUrl(parsed.data.url)
      if (!urlValidation.valid) {
        return res.status(400).json({
          message: "Invalid webhook URL",
          error: urlValidation.error,
        })
      }
    }

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    // Verify team ownership
    const existing = await webhookModuleService.retrieveWebhook(webhook_id)
    if (existing.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    const webhook = await webhookModuleService.updateWebhooks({
      id: webhook_id,
      ...parsed.data,
    })

    return res.json({
      webhook: {
        ...webhook,
        secret: webhook.secret ? "***REDACTED***" : null,
        auth_config: webhook.auth_config ? "***REDACTED***" : null,
      },
    })
  } catch (error: any) {
    console.error("Update webhook error:", error)
    return res.status(500).json({
      message: "Failed to update webhook",
      error: error.message,
    })
  }
}

/**
 * DELETE /admin/webhooks/[id]
 * Delete webhook
 */
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const webhook_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    // Verify team ownership
    const webhook = await webhookModuleService.retrieveWebhook(webhook_id)
    if (webhook.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    await webhookModuleService.deleteWebhooks(webhook_id)

    return res.json({
      message: "Webhook deleted successfully",
      id: webhook_id,
    })
  } catch (error: any) {
    console.error("Delete webhook error:", error)
    return res.status(500).json({
      message: "Failed to delete webhook",
      error: error.message,
    })
  }
}
