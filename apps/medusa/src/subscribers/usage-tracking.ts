import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

// Subscriber for tracking usage events
export default async function usageTrackingSubscriber({
  event,
  container,
}: SubscriberArgs<any>) {
  const usageModuleService = container.resolve("usageModuleService")

  const eventName = event.name
  const eventData = event.data

  try {
    // Get team_id from event data
    const team_id = eventData.team_id

    if (!team_id) {
      console.warn(`No team_id in event ${eventName}`)
      return
    }

    // Get current usage tracker for team
    const usageTrackers = await usageModuleService.listUsageTrackers({
      filters: {
        team_id,
        period_end: { $gte: new Date() }, // Current period
      },
      take: 1,
    })

    if (!usageTrackers || usageTrackers.length === 0) {
      console.warn(`No active usage tracker found for team ${team_id}`)
      return
    }

    const usageTracker = usageTrackers[0]

    // Update usage based on event type
    switch (eventName) {
      case "project.created":
        await usageModuleService.updateUsageTrackers({
          id: usageTracker.id,
          project_count: usageTracker.project_count + 1,
        })
        console.log(`Incremented project count for team ${team_id}`)
        break

      case "file.created":
        // Assume file size is in bytes, convert to GB
        const fileSizeGB = (eventData.size || 0) / (1024 * 1024 * 1024)
        await usageModuleService.updateUsageTrackers({
          id: usageTracker.id,
          storage_gb: usageTracker.storage_gb + fileSizeGB,
        })
        console.log(`Incremented storage by ${fileSizeGB}GB for team ${team_id}`)
        break

      case "email.sent":
      case "portfolio.sent":
        await usageModuleService.updateUsageTrackers({
          id: usageTracker.id,
          email_count: usageTracker.email_count + 1,
        })
        console.log(`Incremented email count for team ${team_id}`)
        break

      case "portfolio.viewed":
        await usageModuleService.updateUsageTrackers({
          id: usageTracker.id,
          portfolio_view_count: usageTracker.portfolio_view_count + 1,
        })
        console.log(`Incremented portfolio view count for team ${team_id}`)
        break

      default:
        console.log(`Unhandled usage event: ${eventName}`)
    }

    // Check if we need to send warnings (80% usage)
    const updated = await usageModuleService.retrieveUsageTracker(usageTracker.id)

    // Storage warning
    if (
      !updated.storage_warning_sent &&
      updated.storage_gb >= updated.storage_limit_gb * 0.8
    ) {
      // TODO: Send warning email/notification
      console.warn(`Storage warning: Team ${team_id} at ${Math.round((updated.storage_gb / updated.storage_limit_gb) * 100)}%`)

      await usageModuleService.updateUsageTrackers({
        id: updated.id,
        storage_warning_sent: true,
      })
    }

    // Project warning
    if (
      !updated.project_warning_sent &&
      updated.project_count >= updated.project_limit * 0.8
    ) {
      console.warn(`Project warning: Team ${team_id} at ${Math.round((updated.project_count / updated.project_limit) * 100)}%`)

      await usageModuleService.updateUsageTrackers({
        id: updated.id,
        project_warning_sent: true,
      })
    }

    // Email warning
    if (
      !updated.email_warning_sent &&
      updated.email_count >= updated.email_limit * 0.8
    ) {
      console.warn(`Email warning: Team ${team_id} at ${Math.round((updated.email_count / updated.email_limit) * 100)}%`)

      await usageModuleService.updateUsageTrackers({
        id: updated.id,
        email_warning_sent: true,
      })
    }
  } catch (error) {
    console.error(`Error tracking usage for event ${eventName}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: [
    "project.created",
    "file.created",
    "email.sent",
    "portfolio.sent",
    "portfolio.viewed",
  ],
}
