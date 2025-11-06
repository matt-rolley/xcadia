import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MODULE } from "@/modules/email"

// Subscribe to notification events to track email delivery and failures
export default async function emailEventSubscriber({ event }: SubscriberArgs<any>) {
  const { container } = event
  const emailModuleService = container.resolve(EMAIL_MODULE)

  // Extract tracking_id from notification metadata or data
  const trackingId = event.data?.tracking_id || event.metadata?.tracking_id

  if (!trackingId) {
    // If no tracking ID, this might not be a portfolio email
    return
  }

  try {
    // Find the portfolio email by tracking ID
    const portfolioEmails = await emailModuleService.listPortfolioEmails({
      filters: { tracking_id: trackingId },
    })

    if (!portfolioEmails || portfolioEmails.length === 0) {
      console.warn(`No portfolio email found for tracking_id: ${trackingId}`)
      return
    }

    const portfolioEmail = Array.isArray(portfolioEmails)
      ? portfolioEmails[0]
      : portfolioEmails

    // Handle different notification events
    if (event.name === "notification.sent") {
      // Email was successfully sent - create delivered event
      await emailModuleService.createEmailEvents({
        portfolio_email_id: portfolioEmail.id,
        event_type: "delivered",
        occurred_at: new Date(),
      })
    } else if (event.name === "notification.failed") {
      // Email failed to send - mark as bounced
      await emailModuleService.updatePortfolioEmails({
        id: portfolioEmail.id,
        bounced_at: new Date(),
        bounce_reason: event.data?.error || "Unknown error",
      })

      await emailModuleService.createEmailEvents({
        portfolio_email_id: portfolioEmail.id,
        event_type: "failed",
        occurred_at: new Date(),
        metadata: {
          error: event.data?.error,
        },
      })
    }
  } catch (error) {
    console.error("Error in email event subscriber:", error)
  }
}

export const config: SubscriberConfig = {
  event: [
    "notification.sent",
    "notification.failed",
  ],
}
