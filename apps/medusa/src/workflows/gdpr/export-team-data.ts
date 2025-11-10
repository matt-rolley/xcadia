import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ExportDataInput = {
  team_id: string
  requested_by: string // user_id
}

type ExportDataOutput = {
  export_id: string
  status: string
  data: {
    team: any
    projects: any[]
    portfolios: any[]
    contacts: any[]
    companies: any[]
    deals: any[]
    emails: any[]
    usage: any[]
  }
}

// Step 1: Collect team data
const collectTeamDataStep = createStep(
  "collect-team-data",
  async ({ team_id }: { team_id: string }, { container }) => {
    const teamModuleService = container.resolve("teamModuleService")
    const portfolioModuleService = container.resolve("portfolioModuleService")
    const companyModuleService = container.resolve("companyModuleService")
    const dealModuleService = container.resolve("dealModuleService")
    const emailModuleService = container.resolve("email")
    const usageModuleService = container.resolve("usageModuleService")

    // Collect all team data (team-scoped)
    const team = await teamModuleService.retrieveTeam(team_id)

    const projects = await portfolioModuleService.listProjects({
      filters: { team_id },
    })

    const portfolios = await portfolioModuleService.listPortfolios({
      filters: { team_id },
    })

    const contacts = await companyModuleService.listContacts({
      filters: { team_id },
    })

    const companies = await companyModuleService.listCompanies({
      filters: { team_id },
    })

    const deals = await dealModuleService.listDeals({
      filters: { team_id },
    })

    const emails = await emailModuleService.listEmails({
      filters: { team_id },
    })

    const usage = await usageModuleService.listUsageTrackers({
      filters: { team_id },
    })

    return new StepResponse({
      team,
      projects,
      portfolios,
      contacts,
      companies,
      deals,
      emails,
      usage,
    })
  }
)

// Step 2: Format data for export (remove sensitive fields)
const formatExportDataStep = createStep(
  "format-export-data",
  async ({ data }: { data: any }) => {
    // Remove sensitive fields before export
    const sanitizeData = (obj: any) => {
      if (!obj) return obj
      const sanitized = { ...obj }

      // Remove common sensitive fields
      delete sanitized.password
      delete sanitized.password_hash
      delete sanitized.token
      delete sanitized.secret
      delete sanitized.api_key

      return sanitized
    }

    const formatted = {
      team: sanitizeData(data.team),
      projects: data.projects.map(sanitizeData),
      portfolios: data.portfolios.map(sanitizeData),
      contacts: data.contacts.map(sanitizeData),
      companies: data.companies.map(sanitizeData),
      deals: data.deals.map(sanitizeData),
      emails: data.emails.map(sanitizeData),
      usage: data.usage.map(sanitizeData),
      export_date: new Date().toISOString(),
    }

    return new StepResponse({ formatted })
  }
)

export const exportTeamDataWorkflow = createWorkflow(
  "export-team-data",
  function (input: ExportDataInput): WorkflowResponse<ExportDataOutput> {
    // Collect all team data
    const data = collectTeamDataStep({ team_id: input.team_id })

    // Format for export
    const { formatted } = formatExportDataStep({ data })

    return new WorkflowResponse({
      export_id: `export_${Date.now()}`,
      status: "completed",
      data: formatted,
    })
  }
)
