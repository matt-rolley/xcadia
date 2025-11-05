import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ProjectCreatedEvent = {
  project_id: string
  team_id: string
  company_id?: string
}

export default async function projectCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<ProjectCreatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`Project ${data.project_id} created for team ${data.team_id}`)

  // TODO: Send notification to team members
  // TODO: If company_id provided, log project association with client
}

export const config: SubscriberConfig = {
  event: "project.created",
}
