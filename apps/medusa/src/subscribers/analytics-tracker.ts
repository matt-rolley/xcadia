import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

/**
 * Analytics Tracker Subscriber
 * Tracks all events for analytics and insights
 */
export default async function analyticsTrackerSubscriber({
  event,
  container,
}: SubscriberArgs<any>) {
  const analyticsModuleService = container.resolve("analyticsModuleService")
  const logger = container.resolve("logger")

  try {
    const eventName = event.name
    const eventData = event.data

    // Get team_id and user_id from event data
    const team_id = eventData.team_id
    const user_id = eventData.user_id || eventData.actor_id

    if (!team_id) {
      return // Skip events without team context
    }

    // Determine event category
    const eventCategory = getEventCategory(eventName)

    // Extract entity information
    const entityType = eventName.split(".")[0]
    const entityId = eventData.id || eventData[`${entityType}_id`]

    // Create analytics event
    await analyticsModuleService.createAnalyticsEvents({
      team_id,
      user_id,
      event_type: eventName,
      event_category: eventCategory,
      entity_id: entityId,
      entity_type: entityType,
      ip_address: eventData.ip_address || null,
      user_agent: eventData.user_agent || null,
      device_type: eventData.device_type || null,
      browser: eventData.browser || null,
      country: eventData.country || null,
      city: eventData.city || null,
      metadata: {
        ...eventData,
        // Remove sensitive fields
        password: undefined,
        password_hash: undefined,
        token: undefined,
        secret: undefined,
        api_key: undefined,
      },
      duration_ms: eventData.duration_ms || null,
    })
  } catch (error: any) {
    logger.error(`Analytics tracker error: ${error.message}`, error)
  }
}

/**
 * Determine event category from event name
 */
function getEventCategory(eventName: string): string {
  if (eventName.startsWith("portfolio.") || eventName.startsWith("project.")) {
    return "portfolio"
  }
  if (eventName.startsWith("contact.")) {
    return "contact"
  }
  if (eventName.startsWith("company.")) {
    return "company"
  }
  if (eventName.startsWith("deal.")) {
    return "deal"
  }
  if (eventName.startsWith("email.")) {
    return "email"
  }
  if (eventName.startsWith("user.") || eventName.startsWith("team.") || eventName.startsWith("auth.")) {
    return "authentication"
  }
  if (eventName.startsWith("webhook.") || eventName.startsWith("integration.")) {
    return "integration"
  }
  return "other"
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

    // Auth events
    "auth.login",
    "auth.logout",
    "auth.failed",
  ],
}
