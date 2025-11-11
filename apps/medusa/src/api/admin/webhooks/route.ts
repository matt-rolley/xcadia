import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { validateWebhookUrl } from "@/lib/webhook-security"

// Validation schemas
const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  auth_type: z.enum(["none", "bearer", "basic", "custom"]).default("none"),
  auth_config: z.record(z.any()).optional(),
  enabled: z.boolean().default(true),
  retry_config: z.object({
    max_retries: z.number().default(3),
    retry_delay: z.number().default(5000),
    backoff_multiplier: z.number().default(2),
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * GET /admin/webhooks
 * List all webhooks for team
 */
export const GET = async (
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

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    const webhooks = await webhookModuleService.listWebhooks({
      filters: { team_id },
      order: { created_at: "DESC" },
    })

    // Redact sensitive fields
    const sanitizedWebhooks = webhooks.map((webhook: any) => ({
      ...webhook,
      secret: webhook.secret ? "***REDACTED***" : null,
      auth_config: webhook.auth_config ? "***REDACTED***" : null,
    }))

    return res.json({
      webhooks: sanitizedWebhooks,
      count: sanitizedWebhooks.length,
    })
  } catch (error: any) {
    console.error("List webhooks error:", error)
    return res.status(500).json({
      message: "Failed to list webhooks",
      error: error.message,
    })
  }
}

/**
 * POST /admin/webhooks
 * Create a new webhook
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
    const parsed = createWebhookSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    // Validate webhook URL for SSRF protection
    const urlValidation = validateWebhookUrl(parsed.data.url)
    if (!urlValidation.valid) {
      return res.status(400).json({
        message: "Invalid webhook URL",
        error: urlValidation.error,
      })
    }

    const webhookModuleService = req.scope.resolve("webhookModuleService")

    const webhook = await webhookModuleService.createWebhooks({
      team_id,
      ...parsed.data,
    })

    return res.status(201).json({
      webhook: {
        ...webhook,
        secret: webhook.secret ? "***REDACTED***" : null,
        auth_config: webhook.auth_config ? "***REDACTED***" : null,
      },
    })
  } catch (error: any) {
    console.error("Create webhook error:", error)
    return res.status(500).json({
      message: "Failed to create webhook",
      error: error.message,
    })
  }
}
