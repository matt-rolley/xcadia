import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

export default async function teamMemberJoinedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  team_id: string
  user_id: string
  user_email: string
}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const teamModuleService: TeamModuleService = container.resolve(TEAM_MODULE)

  logger.info(`User ${data.user_id} joined team ${data.team_id}`)

  // Send welcome email to the new member
  await notificationModuleService.createNotifications({
    to: data.user_email,
    channel: "email",
    template: "team-member-joined",
    data: {
      team_id: data.team_id,
      user_id: data.user_id,
    },
  })

  // Notify team owners
  const teamMembers = await teamModuleService.listTeamMembers({
    filters: {
      team_id: data.team_id,
      role: "owner",
    },
  })

  const owners = Array.isArray(teamMembers) ? teamMembers : [teamMembers]

  for (const owner of owners) {
    if (owner.user_id !== data.user_id) {
      // Note: In production, you'd need to fetch the owner's email from the User module
      logger.info(`Notifying team owner ${owner.user_id} about new member`)
      // await notificationModuleService.createNotifications({
      //   to: owner_email,
      //   channel: "email",
      //   template: "team-new-member-notification",
      //   data: {
      //     team_id: data.team_id,
      //     new_user_id: data.user_id,
      //   },
      // })
    }
  }

  logger.info(`Welcome email sent to ${data.user_email}`)
}

export const config: SubscriberConfig = {
  event: "team.member_joined",
}
