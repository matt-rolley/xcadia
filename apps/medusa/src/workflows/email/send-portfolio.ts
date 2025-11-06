import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MODULE } from "@/modules/email"

type SendPortfolioInput = {
  portfolio_id: string
  contact_ids: string[]
  team_id: string
  subject?: string
  custom_message?: string
}

type SendPortfolioOutput = {
  sent_emails: any[]
}

// Step 1: Validate portfolio belongs to team
const validatePortfolioStep = createStep(
  "validate-portfolio",
  async ({ portfolio_id, team_id }: { portfolio_id: string; team_id: string }, { container }) => {
    const query = container.resolve(Modules.QUERY)

    const { data: portfolios } = await query.graph({
      entity: "portfolio",
      fields: ["id", "team_id"],
      filters: { id: portfolio_id },
    })

    if (!portfolios || portfolios.length === 0) {
      throw new Error("Portfolio not found")
    }

    if (portfolios[0].team_id !== team_id) {
      throw new Error("Portfolio does not belong to your team")
    }

    return new StepResponse({ portfolio: portfolios[0] })
  }
)

// Step 2: Fetch portfolio data with linked items
const fetchPortfolioDataStep = createStep(
  "fetch-portfolio-data",
  async ({ portfolio_id }: { portfolio_id: string }, { container }) => {
    const query = container.resolve(Modules.QUERY)

    const { data: portfolios } = await query.graph({
      entity: "portfolio",
      fields: [
        "*",
        "items.*",
        "items.deal.*",
        "items.deal.company.*",
      ],
      filters: { id: portfolio_id },
    })

    return new StepResponse({ portfolio: portfolios[0] })
  }
)

// Step 3: Fetch contacts
const fetchContactsStep = createStep(
  "fetch-contacts",
  async ({ contact_ids }: { contact_ids: string[] }, { container }) => {
    const query = container.resolve(Modules.QUERY)

    const { data: contacts } = await query.graph({
      entity: "contact",
      fields: ["*", "company.*"],
      filters: { id: contact_ids },
    })

    return new StepResponse({ contacts })
  }
)

// Step 4: Create portfolio email records with tracking IDs
const createPortfolioEmailsStep = createStep(
  "create-portfolio-emails",
  async (
    {
      portfolio_id,
      contacts,
      subject,
      custom_message,
    }: {
      portfolio_id: string
      contacts: any[]
      subject?: string
      custom_message?: string
    },
    { container }
  ) => {
    const emailModuleService = container.resolve(EMAIL_MODULE)
    const { randomUUID } = await import("node:crypto")

    const portfolioEmails = []

    for (const contact of contacts) {
      const portfolioEmail = await emailModuleService.createPortfolioEmails({
        portfolio_id,
        contact_id: contact.id,
        tracking_id: randomUUID(),
        subject: subject || `Portfolio: Curated Deals for ${contact.company?.name || "Your Review"}`,
        sent_at: new Date(),
        metadata: custom_message ? { custom_message } : null,
      })

      portfolioEmails.push(portfolioEmail)
    }

    return new StepResponse(
      { portfolioEmails },
      {
        compensate: async () => {
          // Rollback: Delete created portfolio emails
          const ids = portfolioEmails.map((pe) => pe.id)
          await emailModuleService.softDeletePortfolioEmails(ids)
        },
      }
    )
  }
)

// Step 5: Send emails via Resend notification provider
const sendEmailsStep = createStep(
  "send-emails",
  async (
    {
      contacts,
      portfolioEmails,
      portfolio,
      custom_message,
    }: {
      contacts: any[]
      portfolioEmails: any[]
      portfolio: any
      custom_message?: string
    },
    { container }
  ) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    const sentEmails = []

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const portfolioEmail = portfolioEmails[i]

      try {
        // Build email HTML content
        const trackingPixelUrl = `${process.env.APP_URL || "http://localhost:9000"}/track/pixel/${portfolioEmail.tracking_id}.gif`

        let emailHtml = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f4f4f4; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .deal { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .deal h3 { margin-top: 0; color: #2563eb; }
                .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${portfolio.name}</h1>
                </div>
                <div class="content">
                  <p>Hello ${contact.first_name},</p>
        `

        if (custom_message) {
          emailHtml += `<p>${custom_message}</p>`
        }

        emailHtml += `
                  <p>${portfolio.description || "We've curated a selection of deals that we think would be of interest to you."}</p>
                  <h2>Featured Deals:</h2>
        `

        // Add each deal
        for (const item of portfolio.items || []) {
          const deal = item.deal
          if (!deal) continue

          const dealUrl = `${process.env.APP_URL || "http://localhost:9000"}/track/click/${portfolioEmail.tracking_id}?url=${encodeURIComponent(`/deals/${deal.id}`)}`

          emailHtml += `
                  <div class="deal">
                    <h3>${deal.company?.name || "Company"} - ${deal.name}</h3>
                    <p><strong>Type:</strong> ${deal.deal_type || "N/A"}</p>
                    <p><strong>Stage:</strong> ${deal.stage || "N/A"}</p>
                    ${deal.description ? `<p>${deal.description}</p>` : ""}
                    ${item.notes ? `<p><em>Note: ${item.notes}</em></p>` : ""}
                    <a href="${dealUrl}" class="cta">View Details</a>
                  </div>
          `
        }

        emailHtml += `
                  <p>If you have any questions or would like to discuss these opportunities, please don't hesitate to reach out.</p>
                  <p>Best regards,<br>Your Team</p>
                </div>
                <div class="footer">
                  <p>This email was sent from your portfolio management system.</p>
                </div>
              </div>
              <img src="${trackingPixelUrl}" width="1" height="1" alt="" />
            </body>
          </html>
        `

        await notificationModuleService.createNotifications({
          to: contact.email,
          channel: "email",
          template: "portfolio-send", // This should match the Resend template enum
          data: {
            subject: portfolioEmail.subject,
            html: emailHtml,
          },
        })

        sentEmails.push({
          contact_id: contact.id,
          portfolio_email_id: portfolioEmail.id,
          tracking_id: portfolioEmail.tracking_id,
        })
      } catch (error) {
        // Log error but continue with other emails
        console.error(`Failed to send email to ${contact.email}:`, error)

        // Mark as bounced
        const emailModuleService = container.resolve(EMAIL_MODULE)
        await emailModuleService.updatePortfolioEmails({
          id: portfolioEmail.id,
          bounced_at: new Date(),
          bounce_reason: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return new StepResponse({ sentEmails })
  }
)

// Step 6: Create "delivered" events for successfully sent emails
const createDeliveredEventsStep = createStep(
  "create-delivered-events",
  async ({ sentEmails }: { sentEmails: any[] }, { container }) => {
    const emailModuleService = container.resolve(EMAIL_MODULE)

    for (const sent of sentEmails) {
      await emailModuleService.createEmailEvents({
        portfolio_email_id: sent.portfolio_email_id,
        event_type: "delivered",
        occurred_at: new Date(),
      })
    }

    return new StepResponse({ success: true })
  }
)

export const sendPortfolioWorkflow = createWorkflow(
  "send-portfolio",
  function (input: SendPortfolioInput): WorkflowResponse<SendPortfolioOutput> {
    // Step 1: Validate portfolio belongs to team
    validatePortfolioStep({
      portfolio_id: input.portfolio_id,
      team_id: input.team_id,
    })

    // Step 2: Fetch portfolio data
    const { portfolio } = fetchPortfolioDataStep({
      portfolio_id: input.portfolio_id,
    })

    // Step 3: Fetch contacts
    const { contacts } = fetchContactsStep({
      contact_ids: input.contact_ids,
    })

    // Step 4: Create portfolio email records
    const { portfolioEmails } = createPortfolioEmailsStep({
      portfolio_id: input.portfolio_id,
      contacts,
      subject: input.subject,
      custom_message: input.custom_message,
    })

    // Step 5: Send emails
    const { sentEmails } = sendEmailsStep({
      contacts,
      portfolioEmails,
      portfolio,
      custom_message: input.custom_message,
    })

    // Step 6: Create delivered events
    createDeliveredEventsStep({ sentEmails })

    return new WorkflowResponse({
      sent_emails: sentEmails,
    })
  }
)
