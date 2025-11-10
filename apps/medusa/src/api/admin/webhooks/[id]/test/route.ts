import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * POST /admin/webhooks/[id]/test
 * Test webhook by sending a test event
 */
export const POST = async (
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

    if (!webhook.enabled) {
      return res.status(400).json({
        message: "Webhook is disabled",
      })
    }

    // Prepare test payload
    const testPayload = {
      event: "webhook.test",
      data: {
        team_id,
        message: "This is a test webhook event from Xcadia",
        timestamp: new Date().toISOString(),
      },
      webhook_id: webhook.id,
      timestamp: new Date().toISOString(),
    }

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Xcadia-Webhook/1.0",
      "X-Webhook-Event": "webhook.test",
      "X-Webhook-Id": webhook.id,
    }

    // Add authentication
    if (webhook.auth_type === "bearer" && webhook.auth_config?.token) {
      headers["Authorization"] = `Bearer ${webhook.auth_config.token}`
    } else if (webhook.auth_type === "basic" && webhook.auth_config?.username) {
      const credentials = Buffer.from(
        `${webhook.auth_config.username}:${webhook.auth_config.password}`
      ).toString("base64")
      headers["Authorization"] = `Basic ${credentials}`
    } else if (webhook.auth_type === "custom" && webhook.auth_config?.headers) {
      Object.assign(headers, webhook.auth_config.headers)
    }

    // Add webhook secret
    if (webhook.secret) {
      headers["X-Webhook-Secret"] = webhook.secret
    }

    // Make test request
    const startTime = Date.now()
    let success = false
    let statusCode: number | null = null
    let responseBody = ""
    let error: string | null = null

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      statusCode = response.status
      responseBody = await response.text()
      success = response.ok

      if (!response.ok) {
        error = `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (fetchError: any) {
      error = fetchError.message
    }

    const responseTime = Date.now() - startTime

    // Log the test
    await webhookModuleService.createWebhookLogs({
      webhook_id: webhook.id,
      team_id: webhook.team_id,
      event_type: "webhook.test",
      payload: testPayload,
      url: webhook.url,
      status_code: statusCode,
      response_body: responseBody.substring(0, 1000),
      response_time_ms: responseTime,
      success,
      error,
      retry_count: 0,
    })

    if (success) {
      return res.json({
        message: "Webhook test successful",
        status_code: statusCode,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 500),
      })
    } else {
      return res.status(400).json({
        message: "Webhook test failed",
        status_code: statusCode,
        error,
        response_time_ms: responseTime,
      })
    }
  } catch (error: any) {
    console.error("Test webhook error:", error)
    return res.status(500).json({
      message: "Failed to test webhook",
      error: error.message,
    })
  }
}
