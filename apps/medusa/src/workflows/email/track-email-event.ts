import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { EMAIL_MODULE } from "@/modules/email"

type TrackEmailEventInput = {
  tracking_id: string
  event_type: "opened" | "clicked"
  user_agent?: string
  ip_address?: string
  link_url?: string
}

type TrackEmailEventOutput = {
  success: boolean
  portfolio_email_id?: string
}

// Step 1: Find portfolio email by tracking ID
const findPortfolioEmailStep = createStep(
  "find-portfolio-email",
  async ({ tracking_id }: { tracking_id: string }, { container }) => {
    const emailModuleService = container.resolve(EMAIL_MODULE)

    const portfolioEmails = await emailModuleService.listPortfolioEmails({
      filters: { tracking_id },
    })

    if (!portfolioEmails || portfolioEmails.length === 0) {
      throw new Error("Portfolio email not found")
    }

    const portfolioEmail = Array.isArray(portfolioEmails)
      ? portfolioEmails[0]
      : portfolioEmails

    return new StepResponse({ portfolioEmail })
  }
)

// Step 2: Update portfolio email timestamps
const updatePortfolioEmailStep = createStep(
  "update-portfolio-email",
  async (
    {
      portfolioEmail,
      event_type,
    }: {
      portfolioEmail: any
      event_type: "opened" | "clicked"
    },
    { container }
  ) => {
    const emailModuleService = container.resolve(EMAIL_MODULE)

    const updateData: any = {
      id: portfolioEmail.id,
    }

    // Update opened_at on first open
    if (event_type === "opened" && !portfolioEmail.opened_at) {
      updateData.opened_at = new Date()
    }

    // Update clicked_at on first click
    if (event_type === "clicked" && !portfolioEmail.clicked_at) {
      updateData.clicked_at = new Date()
    }

    // Only update if we have fields to update
    if (Object.keys(updateData).length > 1) {
      await emailModuleService.updatePortfolioEmails(updateData)
    }

    return new StepResponse({ updated: Object.keys(updateData).length > 1 })
  }
)

// Step 3: Create email event record
const createEmailEventStep = createStep(
  "create-email-event",
  async (
    {
      portfolioEmail,
      event_type,
      user_agent,
      ip_address,
      link_url,
    }: {
      portfolioEmail: any
      event_type: "opened" | "clicked"
      user_agent?: string
      ip_address?: string
      link_url?: string
    },
    { container }
  ) => {
    const emailModuleService = container.resolve(EMAIL_MODULE)

    const emailEvent = await emailModuleService.createEmailEvents({
      portfolio_email_id: portfolioEmail.id,
      event_type,
      occurred_at: new Date(),
      user_agent: user_agent || null,
      ip_address: ip_address || null,
      link_url: link_url || null,
    })

    return new StepResponse({ emailEvent })
  }
)

export const trackEmailEventWorkflow = createWorkflow(
  "track-email-event",
  function (input: TrackEmailEventInput): WorkflowResponse<TrackEmailEventOutput> {
    // Step 1: Find portfolio email
    const { portfolioEmail } = findPortfolioEmailStep({
      tracking_id: input.tracking_id,
    })

    // Step 2: Update timestamps
    updatePortfolioEmailStep({
      portfolioEmail,
      event_type: input.event_type,
    })

    // Step 3: Create event record
    createEmailEventStep({
      portfolioEmail,
      event_type: input.event_type,
      user_agent: input.user_agent,
      ip_address: input.ip_address,
      link_url: input.link_url,
    })

    return new WorkflowResponse({
      success: true,
      portfolio_email_id: portfolioEmail.id,
    })
  }
)
