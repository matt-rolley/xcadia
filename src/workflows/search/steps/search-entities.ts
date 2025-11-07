import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"
import { COMPANY_MODULE } from "@/modules/company"

type SearchInput = {
  query: string
  team_id: string
  entity_types?: string[]
  limit?: number
}

export const searchEntitiesStep = createStep(
  "search-entities",
  async (input: SearchInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { query: searchQuery, team_id, entity_types, limit = 10 } = input

    // Determine which entities to search
    const shouldSearch = (type: string) =>
      !entity_types || entity_types.length === 0 || entity_types.includes(type)

    const results: any = {
      projects: [],
      portfolios: [],
      contacts: [],
      companies: [],
      total_count: 0,
    }

    // Search pattern for PostgreSQL ILIKE
    const searchPattern = `%${searchQuery}%`

    // Search Projects
    if (shouldSearch("project")) {
      try {
        const { data: projects } = await query.graph({
          entity: "project",
          fields: ["id", "name", "description", "team_id", "created_at"],
          filters: {
            team_id,
            $or: [
              { name: { $ilike: searchPattern } },
              { description: { $ilike: searchPattern } },
            ],
          },
          pagination: {
            take: limit,
            order: { created_at: "DESC" },
          },
        })
        results.projects = projects || []
        results.total_count += results.projects.length
      } catch (error) {
        console.error("Error searching projects:", error)
      }
    }

    // Search Portfolios
    if (shouldSearch("portfolio")) {
      try {
        const { data: portfolios } = await query.graph({
          entity: "portfolio",
          fields: ["id", "name", "description", "team_id", "created_at"],
          filters: {
            team_id,
            $or: [
              { name: { $ilike: searchPattern } },
              { description: { $ilike: searchPattern } },
            ],
          },
          pagination: {
            take: limit,
            order: { created_at: "DESC" },
          },
        })
        results.portfolios = portfolios || []
        results.total_count += results.portfolios.length
      } catch (error) {
        console.error("Error searching portfolios:", error)
      }
    }

    // Search Contacts
    if (shouldSearch("contact")) {
      try {
        const { data: contacts } = await query.graph({
          entity: "contact",
          fields: [
            "id",
            "first_name",
            "last_name",
            "email",
            "job_title",
            "company_id",
            "created_at",
          ],
          filters: {
            $or: [
              { first_name: { $ilike: searchPattern } },
              { last_name: { $ilike: searchPattern } },
              { email: { $ilike: searchPattern } },
              { job_title: { $ilike: searchPattern } },
            ],
          },
          pagination: {
            take: limit,
            order: { created_at: "DESC" },
          },
        })
        results.contacts = contacts || []
        results.total_count += results.contacts.length
      } catch (error) {
        console.error("Error searching contacts:", error)
      }
    }

    // Search Companies
    if (shouldSearch("company")) {
      try {
        const { data: companies } = await query.graph({
          entity: "company",
          fields: [
            "id",
            "name",
            "website",
            "industry",
            "team_id",
            "created_at",
          ],
          filters: {
            team_id,
            $or: [
              { name: { $ilike: searchPattern } },
              { website: { $ilike: searchPattern } },
              { industry: { $ilike: searchPattern } },
            ],
          },
          pagination: {
            take: limit,
            order: { created_at: "DESC" },
          },
        })
        results.companies = companies || []
        results.total_count += results.companies.length
      } catch (error) {
        console.error("Error searching companies:", error)
      }
    }

    return new StepResponse(results)
  }
)
