import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IN_APP_NOTIFICATION_MODULE } from "@/modules/notification"

export default async function notificationAlertsSubscriber({
  event,
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationService = container.resolve(IN_APP_NOTIFICATION_MODULE)

  try {
    const { data } = event
    let notificationData: any = null

    switch (event.name) {
      case "portfolio.viewed":
        notificationData = {
          team_id: data.team_id,
          user_id: data.sender_user_id, // Notify the person who sent the portfolio
          type: "portfolio_viewed",
          title: "Portfolio Viewed",
          message: `Your portfolio was viewed by ${data.contact_email || "a contact"}`,
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
        }
        break

      case "portfolio.sent":
        // Notify team owners when portfolio is sent
        // TODO: Fetch team owners from team module
        notificationData = {
          team_id: data.team_id,
          user_id: data.user_id,
          type: "portfolio_sent",
          title: "Portfolio Sent",
          message: `Portfolio sent to ${data.email}`,
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
        }
        break

      case "email.opened":
        notificationData = {
          team_id: data.team_id,
          user_id: data.sender_user_id,
          type: "email_opened",
          title: "Email Opened",
          message: `${data.contact_email} opened your portfolio email`,
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
        }
        break

      case "email.clicked":
        notificationData = {
          team_id: data.team_id,
          user_id: data.sender_user_id,
          type: "email_clicked",
          title: "Link Clicked",
          message: `${data.contact_email} clicked a link in your portfolio email`,
          entity_type: "portfolio",
          entity_id: data.portfolio_id,
        }
        break

      case "team.member_invited":
        // Notify team owners about new invitation
        notificationData = {
          team_id: data.team_id,
          user_id: data.invited_by,
          type: "member_invited",
          title: "Team Member Invited",
          message: `${data.email} was invited to join the team`,
          entity_type: "team",
          entity_id: data.team_id,
        }
        break

      case "team.member_joined":
        // Notify all team members when someone joins
        // TODO: Notify all team members, not just one
        notificationData = {
          team_id: data.team_id,
          user_id: data.invited_by, // Notify the person who invited them
          type: "member_joined",
          title: "Team Member Joined",
          message: `${data.email || "New member"} joined the team`,
          entity_type: "team",
          entity_id: data.team_id,
        }
        break

      case "project.created":
        // Could notify team leads about new projects
        break

      case "company.created":
        // Could notify team about new companies
        break

      case "contact.created":
        // Could notify team about new contacts
        break

      default:
        // Event doesn't need notification
        return
    }

    if (notificationData) {
      await notificationService.createInAppNotifications(notificationData)
      logger.info(`Notification created: ${notificationData.type} for user ${notificationData.user_id}`)
    }
  } catch (error) {
    logger.error("Error creating notification:", error)
  }
}

export const config: SubscriberConfig = {
  event: [
    "portfolio.viewed",
    "portfolio.sent",
    "email.opened",
    "email.clicked",
    "team.member_invited",
    "team.member_joined",
    "project.created",
    "company.created",
    "contact.created",
  ],
}
