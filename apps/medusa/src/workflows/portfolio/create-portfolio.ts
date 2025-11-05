import { createWorkflow, WorkflowResponse, when } from "@medusajs/framework/workflows-sdk"
import { emitEventStep, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createPortfolioStep, CreatePortfolioStepInput } from "./steps/create-portfolio"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { TEAM_MODULE } from "@/modules/team"
import { COMPANY_MODULE } from "@/modules/company"

export type CreatePortfolioWorkflowInput = CreatePortfolioStepInput

export const createPortfolioWorkflow = createWorkflow(
  "create-portfolio",
  function (input: CreatePortfolioWorkflowInput) {
    const portfolio = createPortfolioStep(input)

    // Link portfolio to team
    createRemoteLinkStep([
      {
        [PORTFOLIO_MODULE]: { portfolio_id: portfolio.id },
        [TEAM_MODULE]: { team_id: input.team_id },
      },
    ])

    // Link to contact if provided
    when({ input }, ({ input }) => !!input.contact_id).then(() => {
      createRemoteLinkStep([
        {
          [PORTFOLIO_MODULE]: { portfolio_id: portfolio.id },
          [COMPANY_MODULE]: { contact_id: input.contact_id },
        },
      ])
    })

    // Emit event for subscribers
    emitEventStep({
      eventName: "portfolio.created",
      data: {
        portfolio_id: portfolio.id,
        team_id: input.team_id,
        contact_id: input.contact_id,
      },
    })

    return new WorkflowResponse({ portfolio })
  }
)
