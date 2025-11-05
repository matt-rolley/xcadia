import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PortfolioCreatedEvent = {
  portfolio_id: string
  team_id: string
  contact_id?: string
}

export default async function portfolioCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<PortfolioCreatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`Portfolio ${data.portfolio_id} created for team ${data.team_id}`)

  // TODO: Send notification to team members
  // TODO: If contact_id provided, send portfolio link to contact
}

export const config: SubscriberConfig = {
  event: "portfolio.created",
}
