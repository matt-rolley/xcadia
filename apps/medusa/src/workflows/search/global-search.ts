import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type GlobalSearchInput = {
  team_id: string
  query: string
  entity_types?: string[] // Optional filter: ["project", "portfolio", "contact", "company", "deal"]
  limit_per_type?: number
}

type SearchResults = {
  projects: any[]
  portfolios: any[]
  contacts: any[]
  companies: any[]
  deals: any[]
  total_count: number
}

// Step 1: Search Projects
const searchProjectsStep = createStep(
  "search-projects",
  async (
    { team_id, query, limit }: { team_id: string; query: string; limit: number },
    { container }
  ) => {
    const portfolioModuleService = container.resolve("portfolioModuleService")

    // Search projects by title, description, category, or tags
    const projects = await portfolioModuleService.listProjects({
      filters: {
        team_id,
        $or: [
          { title: { $ilike: `%${query}%` } },
          { description: { $ilike: `%${query}%` } },
          { category: { $ilike: `%${query}%` } },
        ],
      },
      take: limit,
    })

    return new StepResponse({ projects })
  }
)

// Step 2: Search Portfolios
const searchPortfoliosStep = createStep(
  "search-portfolios",
  async (
    { team_id, query, limit }: { team_id: string; query: string; limit: number },
    { container }
  ) => {
    const portfolioModuleService = container.resolve("portfolioModuleService")

    const portfolios = await portfolioModuleService.listPortfolios({
      filters: {
        team_id,
        $or: [
          { title: { $ilike: `%${query}%` } },
          { description: { $ilike: `%${query}%` } },
          { slug: { $ilike: `%${query}%` } },
        ],
      },
      take: limit,
    })

    return new StepResponse({ portfolios })
  }
)

// Step 3: Search Contacts
const searchContactsStep = createStep(
  "search-contacts",
  async (
    { team_id, query, limit }: { team_id: string; query: string; limit: number },
    { container }
  ) => {
    const companyModuleService = container.resolve("companyModuleService")

    const contacts = await companyModuleService.listContacts({
      filters: {
        team_id,
        $or: [
          { first_name: { $ilike: `%${query}%` } },
          { last_name: { $ilike: `%${query}%` } },
          { email: { $ilike: `%${query}%` } },
          { job_title: { $ilike: `%${query}%` } },
          { notes: { $ilike: `%${query}%` } },
        ],
      },
      take: limit,
    })

    return new StepResponse({ contacts })
  }
)

// Step 4: Search Companies
const searchCompaniesStep = createStep(
  "search-companies",
  async (
    { team_id, query, limit }: { team_id: string; query: string; limit: number },
    { container }
  ) => {
    const companyModuleService = container.resolve("companyModuleService")

    const companies = await companyModuleService.listCompanies({
      filters: {
        team_id,
        $or: [
          { name: { $ilike: `%${query}%` } },
          { industry: { $ilike: `%${query}%` } },
          { website: { $ilike: `%${query}%` } },
          { notes: { $ilike: `%${query}%` } },
        ],
      },
      take: limit,
    })

    return new StepResponse({ companies })
  }
)

// Step 5: Search Deals
const searchDealsStep = createStep(
  "search-deals",
  async (
    { team_id, query, limit }: { team_id: string; query: string; limit: number },
    { container }
  ) => {
    const dealModuleService = container.resolve("dealModuleService")

    const deals = await dealModuleService.listDeals({
      filters: {
        team_id,
        $or: [
          { name: { $ilike: `%${query}%` } },
          { description: { $ilike: `%${query}%` } },
        ],
      },
      take: limit,
    })

    return new StepResponse({ deals })
  }
)

export const globalSearchWorkflow = createWorkflow(
  "global-search",
  function (input: GlobalSearchInput): WorkflowResponse<SearchResults> {
    const limit = input.limit_per_type || 10
    const entityTypes = input.entity_types || ["project", "portfolio", "contact", "company", "deal"]

    // Run searches in parallel for performance
    let projectResults = { projects: [] }
    let portfolioResults = { portfolios: [] }
    let contactResults = { contacts: [] }
    let companyResults = { companies: [] }
    let dealResults = { deals: [] }

    if (entityTypes.includes("project")) {
      projectResults = searchProjectsStep({
        team_id: input.team_id,
        query: input.query,
        limit,
      })
    }

    if (entityTypes.includes("portfolio")) {
      portfolioResults = searchPortfoliosStep({
        team_id: input.team_id,
        query: input.query,
        limit,
      })
    }

    if (entityTypes.includes("contact")) {
      contactResults = searchContactsStep({
        team_id: input.team_id,
        query: input.query,
        limit,
      })
    }

    if (entityTypes.includes("company")) {
      companyResults = searchCompaniesStep({
        team_id: input.team_id,
        query: input.query,
        limit,
      })
    }

    if (entityTypes.includes("deal")) {
      dealResults = searchDealsStep({
        team_id: input.team_id,
        query: input.query,
        limit,
      })
    }

    return new WorkflowResponse({
      projects: projectResults.projects,
      portfolios: portfolioResults.portfolios,
      contacts: contactResults.contacts,
      companies: companyResults.companies,
      deals: dealResults.deals,
      total_count:
        projectResults.projects.length +
        portfolioResults.portfolios.length +
        contactResults.contacts.length +
        companyResults.companies.length +
        dealResults.deals.length,
    })
  }
)
