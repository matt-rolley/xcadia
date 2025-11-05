import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function teamMemberInvitedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  team_id: string
  inviter_user_id: string
  invited_user_id: string
  invited_user_email: string
  role: string
}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  logger.info(`Sending team invitation email to ${data.invited_user_email}`)

  // Send invitation email
  await notificationModuleService.createNotifications({
    to: data.invited_user_email,
    channel: "email",
    template: "team-member-invited",
    data: {
      team_id: data.team_id,
      inviter_user_id: data.inviter_user_id,
      invited_user_id: data.invited_user_id,
      role: data.role,
    },
  })

  logger.info(`Team invitation email sent to ${data.invited_user_email}`)
}

export const config: SubscriberConfig = {
  event: "team.member_invited",
}
