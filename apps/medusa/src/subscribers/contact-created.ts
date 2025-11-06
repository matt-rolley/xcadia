import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ContactCreatedEvent = {
  contact_id: string
  company_id: string
  email: string
}

export default async function contactCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<ContactCreatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`Contact ${data.contact_id} created for company ${data.company_id}`)

  // TODO: Send welcome email to contact
  // TODO: Add contact to mailing list
  // TODO: Create activity log entry
}

export const config: SubscriberConfig = {
  event: "contact.created",
}
