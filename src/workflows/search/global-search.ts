import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { searchEntitiesStep } from "./steps/search-entities"

type GlobalSearchInput = {
  query: string
  team_id: string
  entity_types?: string[] // Filter by entity types
  limit?: number
}

type SearchResult = {
  projects: any[]
  portfolios: any[]
  contacts: any[]
  companies: any[]
  total_count: number
}

export const globalSearchWorkflow = createWorkflow(
  "global-search",
  (input: GlobalSearchInput) => {
    const results = searchEntitiesStep(input)
    return new WorkflowResponse(results)
  }
)
