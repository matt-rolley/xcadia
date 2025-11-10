import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

/**
 * Webhook Dispatcher Subscriber
 * Listens to all events and dispatches them to configured webhooks
 */
export default async function webhookDispatcherSubscriber({
  event,
  container,
}: SubscriberArgs<any>) {
  const webhookModuleService = container.resolve("webhookModuleService")
  const logger = container.resolve("logger")

  try {
    const eventName = event.name
    const eventData = event.data

    // Get team_id from event data
    const team_id = eventData.team_id
    if (!team_id) {
      return // Skip events without team context
    }

    // Find all enabled webhooks for this team that listen to this event
    const webhooks = await webhookModuleService.listWebhooks({
      filters: {
        team_id,
        enabled: true,
      },
    })

    if (!webhooks || webhooks.length === 0) {
      return
    }

    // Filter webhooks that are subscribed to this event
    const matchingWebhooks = webhooks.filter((webhook: any) => {
      const events = webhook.events || []
      return (
        events.includes(eventName) ||
        events.includes("*") || // Wildcard for all events
        events.includes(`${eventName.split(".")[0]}.*`) // Category wildcard
      )
    })

    if (matchingWebhooks.length === 0) {
      return
    }

    // Dispatch to each matching webhook
    for (const webhook of matchingWebhooks) {
      await dispatchWebhook(webhook, eventName, eventData, webhookModuleService, logger)
    }
  } catch (error) {
    logger.error(`Webhook dispatcher error: ${error.message}`, error)
  }
}

/**
 * Dispatch a webhook with retry logic
 */
async function dispatchWebhook(
  webhook: any,
  eventName: string,
  eventData: any,
  webhookModuleService: any,
  logger: any
) {
  const retryConfig = webhook.retry_config || {
    max_retries: 3,
    retry_delay: 5000,
    backoff_multiplier: 2,
  }

  let retryCount = 0
  let lastError: string | null = null

  const payload = {
    event: eventName,
    data: eventData,
    webhook_id: webhook.id,
    timestamp: new Date().toISOString(),
  }

  const startTime = Date.now()

  while (retryCount <= retryConfig.max_retries) {
    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Xcadia-Webhook/1.0",
        "X-Webhook-Event": eventName,
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

      // Add webhook secret for signature verification
      if (webhook.secret) {
        headers["X-Webhook-Secret"] = webhook.secret
      }

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseTime = Date.now() - startTime
      const responseBody = await response.text()

      // Log the webhook delivery
      await webhookModuleService.createWebhookLogs({
        webhook_id: webhook.id,
        team_id: webhook.team_id,
        event_type: eventName,
        payload,
        url: webhook.url,
        status_code: response.status,
        response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
        response_time_ms: responseTime,
        success: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        retry_count: retryCount,
      })

      // Update webhook stats
      if (response.ok) {
        await webhookModuleService.updateWebhooks({
          id: webhook.id,
          success_count: webhook.success_count + 1,
          last_triggered_at: new Date(),
          last_success_at: new Date(),
        })
        return // Success!
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`
        throw new Error(lastError)
      }
    } catch (error: any) {
      lastError = error.message
      retryCount++

      if (retryCount <= retryConfig.max_retries) {
        // Wait before retry with exponential backoff
        const delay = retryConfig.retry_delay * Math.pow(retryConfig.backoff_multiplier, retryCount - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        // Max retries reached
        const responseTime = Date.now() - startTime

        await webhookModuleService.createWebhookLogs({
          webhook_id: webhook.id,
          team_id: webhook.team_id,
          event_type: eventName,
          payload,
          url: webhook.url,
          status_code: null,
          response_body: null,
          response_time_ms: responseTime,
          success: false,
          error: lastError,
          retry_count: retryCount,
        })

        await webhookModuleService.updateWebhooks({
          id: webhook.id,
          failure_count: webhook.failure_count + 1,
          last_triggered_at: new Date(),
          last_failure_at: new Date(),
          last_error: lastError,
        })

        logger.error(`Webhook ${webhook.id} failed after ${retryCount} retries: ${lastError}`)
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: [
    // Portfolio events
    "project.created",
    "project.updated",
    "project.deleted",
    "portfolio.created",
    "portfolio.updated",
    "portfolio.deleted",
    "portfolio.sent",
    "portfolio.viewed",

    // Contact & Company events
    "contact.created",
    "contact.updated",
    "contact.deleted",
    "company.created",
    "company.updated",
    "company.deleted",

    // Deal events
    "deal.created",
    "deal.updated",
    "deal.deleted",
    "deal.stage_changed",
    "deal.won",
    "deal.lost",

    // Email events
    "email.sent",
    "email.opened",
    "email.clicked",
    "email.bounced",
    "email.failed",

    // User events
    "user.created",
    "user.updated",
    "team.created",
    "team.updated",
  ],
}
