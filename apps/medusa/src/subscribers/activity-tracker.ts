import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ACTIVITY_MODULE } from "@/modules/activity"

type ActivityEvent = {
  entity_type: string
  entity_id: string
  team_id: string
  user_id?: string
  action: string
  metadata?: Record<string, any>
}

export default async function activityTrackerSubscriber({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const activityModuleService = container.resolve(ACTIVITY_MODULE)

  try {
    const { data } = event
    let activityData: Partial<ActivityEvent> | null = null

    // Map event names to activity data
    switch (event.name) {
      // Project events
      case "project.created":
        activityData = {
          entity_type: "project",
          entity_id: data.project_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "created",
          metadata: {
            company_id: data.company_id,
          },
        }
        break

      case "project.updated":
        activityData = {
          entity_type: "project",
          entity_id: data.project_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "updated",
          metadata: data.changes,
        }
        break

      case "project.deleted":
        activityData = {
          entity_type: "project",
          entity_id: data.project_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "deleted",
        }
        break

      // Portfolio events
      case "portfolio.created":
        activityData = {
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "created",
          metadata: {
            project_count: data.project_count,
          },
        }
        break

      case "portfolio.updated":
        activityData = {
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "updated",
        }
        break

      case "portfolio.sent":
        activityData = {
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "sent",
          metadata: {
            contact_id: data.contact_id,
            email: data.email,
          },
        }
        break

      case "portfolio.viewed":
        activityData = {
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
          team_id: data.team_id,
          action: "viewed",
          metadata: {
            contact_id: data.contact_id,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
          },
        }
        break

      // Contact events
      case "contact.created":
        activityData = {
          entity_type: "contact",
          entity_id: data.contact_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "created",
          metadata: {
            company_id: data.company_id,
            email: data.email,
          },
        }
        break

      // Company events
      case "company.created":
        activityData = {
          entity_type: "company",
          entity_id: data.company_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "created",
          metadata: {
            name: data.name,
          },
        }
        break

      // Team events
      case "team.member_invited":
        activityData = {
          entity_type: "team",
          entity_id: data.team_id,
          team_id: data.team_id,
          user_id: data.invited_by,
          action: "invited",
          metadata: {
            invited_email: data.email,
            role: data.role,
          },
        }
        break

      case "team.member_joined":
        activityData = {
          entity_type: "team",
          entity_id: data.team_id,
          team_id: data.team_id,
          user_id: data.user_id,
          action: "joined",
          metadata: {
            role: data.role,
          },
        }
        break

      case "team.member_left":
        activityData = {
          entity_type: "team",
          entity_id: data.team_id,
          team_id: data.team_id,
          user_id: data.removed_by,
          action: "left",
          metadata: {
            removed_user_id: data.user_id,
          },
        }
        break

      // Email events
      case "email.opened":
        activityData = {
          entity_type: "email",
          entity_id: data.email_id,
          team_id: data.team_id,
          action: "opened",
          metadata: {
            portfolio_id: data.portfolio_id,
            contact_id: data.contact_id,
            ip_address: data.ip_address,
          },
        }
        break

      case "email.clicked":
        activityData = {
          entity_type: "email",
          entity_id: data.email_id,
          team_id: data.team_id,
          action: "clicked",
          metadata: {
            portfolio_id: data.portfolio_id,
            contact_id: data.contact_id,
            url: data.url,
          },
        }
        break

      default:
        // Event not tracked in activity feed
        return
    }

    if (activityData) {
      await activityModuleService.createActivities({
        ...activityData,
        occurred_at: new Date(),
      })

      logger.info(
        `Activity tracked: ${activityData.action} ${activityData.entity_type} (${activityData.entity_id})`
      )
    }
  } catch (error) {
    logger.error("Error tracking activity:", error)
    // Don't throw - activity tracking should not break the main workflow
  }
}

export const config: SubscriberConfig = {
  event: [
    // Project events
    "project.created",
    "project.updated",
    "project.deleted",
    // Portfolio events
    "portfolio.created",
    "portfolio.updated",
    "portfolio.sent",
    "portfolio.viewed",
    // Contact events
    "contact.created",
    // Company events
    "company.created",
    // Team events
    "team.member_invited",
    "team.member_joined",
    "team.member_left",
    // Email events
    "email.opened",
    "email.clicked",
  ],
}
