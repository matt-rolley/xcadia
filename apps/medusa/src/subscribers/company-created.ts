import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type CompanyCreatedEvent = {
  company_id: string
  team_id: string
}

export default async function companyCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<CompanyCreatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`Company ${data.company_id} created for team ${data.team_id}`)

  // TODO: Send notification to team members
  // TODO: Create activity log entry
  // TODO: Trigger any welcome workflows (e.g., send welcome email to company)
}

export const config: SubscriberConfig = {
  event: "company.created",
}
