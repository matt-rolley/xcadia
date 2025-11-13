import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type BulkSendInput = {
  team_id: string
  portfolio_id: string
  contact_ids: string[]
  subject_template: string
  message_template: string
  sender_id: string // user_id of sender
}

type BulkSendResult = {
  sent_count: number
  failed_count: number
  errors: Array<{ contact_id: string; error: string }>
}

// Helper function to interpolate template variables
function interpolateTemplate(
  template: string,
  variables: Record<string, any>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split(".")
    let value: any = variables

    for (const k of keys) {
      value = value?.[k]
    }

    return value !== undefined ? String(value) : match
  })
}

// Step 1: Validate all contacts belong to team
const validateContactsStep = createStep(
  "validate-contacts-bulk",
  async ({ contact_ids, team_id }: { contact_ids: string[]; team_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch all contacts to verify they belong to the team
    const { data: contacts } = await query.graph({
      entity: "contact",
      fields: ["id", "team_id"],
      filters: { id: contact_ids },
    })

    if (!contacts || contacts.length === 0) {
      throw new Error("No contacts found")
    }

    // Check if we got all the requested contacts
    if (contacts.length !== contact_ids.length) {
      throw new Error("Some contacts were not found")
    }

    // Verify all contacts belong to the team
    const invalidContacts = contacts.filter(c => c.team_id !== team_id)
    if (invalidContacts.length > 0) {
      throw new Error("Some contacts do not belong to your team")
    }

    return new StepResponse({ validated: true })
  }
)

// Step 2: Fetch portfolio and sender details
const fetchContextStep = createStep(
  "fetch-context",
  async (
    { portfolio_id, sender_id, team_id }: { portfolio_id: string; sender_id: string; team_id: string },
    { container }
  ) => {
    const portfolioModuleService = container.resolve("portfolioModuleService")
    const teamModuleService = container.resolve("teamModuleService")

    // Fetch portfolio
    const portfolio = await portfolioModuleService.retrievePortfolio(portfolio_id)

    // Verify portfolio belongs to team
    if (portfolio.team_id !== team_id) {
      throw new Error("Portfolio not found")
    }

    // Fetch team info
    const team = await teamModuleService.retrieveTeam(team_id)

    // Fetch sender user info (would come from Medusa User module)
    // For now, we'll use a placeholder
    const sender = {
      name: "Team Member", // TODO: Fetch from User module
      email: "team@example.com",
    }

    return new StepResponse({ portfolio, team, sender })
  }
)

// Step 3: Process each contact and send personalized email
const sendToContactsStep = createStep(
  "send-to-contacts",
  async (
    {
      contact_ids,
      subject_template,
      message_template,
      portfolio,
      team,
      sender,
    }: {
      contact_ids: string[]
      subject_template: string
      message_template: string
      portfolio: any
      team: any
      sender: any
    },
    { container }
  ) => {
    const companyModuleService = container.resolve("companyModuleService")
    const emailModuleService = container.resolve("email")

    let sent_count = 0
    let failed_count = 0
    const errors: Array<{ contact_id: string; error: string }> = []

    // Process each contact
    for (const contact_id of contact_ids) {
      try {
        // Fetch contact with company details
        const contact = await companyModuleService.retrieveContact(contact_id, {
          relations: ["company"],
        })

        // Build interpolation variables
        const variables = {
          contact: {
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            job_title: contact.job_title || "there",
          },
          company: {
            name: contact.company?.name || "your company",
            industry: contact.company?.industry || "",
          },
          sender: {
            name: sender.name,
            email: sender.email,
          },
          team: {
            name: team.name,
          },
          portfolio: {
            title: portfolio.title,
            url: `https://xcadia.com/p/${portfolio.slug}`,
          },
        }

        // Interpolate templates
        const subject = interpolateTemplate(subject_template, variables)
        const message = interpolateTemplate(message_template, variables)

        // Send email via Email module
        await emailModuleService.createEmails({
          team_id: team.id,
          to_email: contact.email,
          to_name: `${contact.first_name} ${contact.last_name}`,
          subject,
          html_content: message,
          portfolio_id: portfolio.id,
          contact_id: contact.id,
          sent_by: sender.email,
          status: "pending",
        })

        sent_count++
      } catch (error) {
        console.error(`Failed to send to contact ${contact_id}:`, error)
        failed_count++
        errors.push({
          contact_id,
          error: error.message,
        })
      }
    }

    return new StepResponse({
      sent_count,
      failed_count,
      errors,
    })
  }
)

export const bulkSendPortfolioWorkflow = createWorkflow(
  "bulk-send-portfolio",
  function (input: BulkSendInput): WorkflowResponse<BulkSendResult> {
    // Step 1: Validate all contacts belong to team
    validateContactsStep({
      contact_ids: input.contact_ids,
      team_id: input.team_id,
    })

    // Step 2: Fetch context
    const { portfolio, team, sender } = fetchContextStep({
      portfolio_id: input.portfolio_id,
      sender_id: input.sender_id,
      team_id: input.team_id,
    })

    // Step 3: Send to all contacts
    const { sent_count, failed_count, errors } = sendToContactsStep({
      contact_ids: input.contact_ids,
      subject_template: input.subject_template,
      message_template: input.message_template,
      portfolio,
      team,
      sender,
    })

    return new WorkflowResponse({
      sent_count,
      failed_count,
      errors,
    })
  }
)
