import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/activity/feed - Real-time activity feed for dashboard
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const teamId = (req as any).team_id

  const { limit = 20, offset = 0 } = req.query

  // Get recent activities with expanded user and entity data
  const { data: activities } = await query.graph({
    entity: "activity",
    fields: [
      "*",
      // We'll need to implement links to User module for user details
      // "user.*",
    ],
    filters: teamId ? { team_id: teamId } : {},
    pagination: {
      skip: Number(offset),
      take: Number(limit),
      order: {
        occurred_at: "DESC",
      },
    },
  })

  // Format activities for timeline display
  const formattedActivities = activities.map((activity: any) => ({
    id: activity.id,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id,
    action: activity.action,
    user_id: activity.user_id,
    metadata: activity.metadata,
    occurred_at: activity.occurred_at,
    // Generate human-readable message
    message: formatActivityMessage(activity),
  }))

  res.json({
    activities: formattedActivities,
    count: formattedActivities.length,
  })
}

// Helper function to format activity messages
function formatActivityMessage(activity: any): string {
  const { entity_type, action, metadata } = activity

  switch (`${entity_type}.${action}`) {
    case "project.created":
      return `created a new project`
    case "project.updated":
      return `updated project`
    case "project.deleted":
      return `deleted project`
    case "portfolio.created":
      return `created a new portfolio`
    case "portfolio.sent":
      return `sent portfolio to ${metadata?.email || "contact"}`
    case "portfolio.viewed":
      return `portfolio was viewed`
    case "contact.created":
      return `added a new contact`
    case "company.created":
      return `added a new company: ${metadata?.name || ""}`
    case "team.invited":
      return `invited ${metadata?.invited_email} to the team`
    case "team.joined":
      return `joined the team`
    case "email.opened":
      return `portfolio email was opened`
    case "email.clicked":
      return `clicked link in portfolio email`
    default:
      return `${action} ${entity_type}`
  }
}
