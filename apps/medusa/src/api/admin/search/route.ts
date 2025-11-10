import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { globalSearchWorkflow } from "@/workflows/search/global-search"
import { z } from "zod"

// Validation schema for search query
const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  type: z.string().optional(), // Comma-separated entity types
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
})

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Validate query parameters
    const parsed = searchQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid search parameters",
        errors: parsed.error.errors,
      })
    }

    const { q, type, limit } = parsed.data

    // Get team_id from authenticated user's context
    // TODO: Extract from auth middleware/session
    const team_id = req.auth_context?.team_id || req.query.team_id as string

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Parse entity types filter
    const entity_types = type
      ? type.split(",").map(t => t.trim())
      : undefined

    // Execute search workflow
    const { result } = await globalSearchWorkflow(req.scope).run({
      input: {
        team_id,
        query: q,
        entity_types,
        limit_per_type: limit,
      },
    })

    return res.json({
      query: q,
      results: {
        projects: result.projects,
        portfolios: result.portfolios,
        contacts: result.contacts,
        companies: result.companies,
        deals: result.deals,
      },
      total_count: result.total_count,
      filters: {
        entity_types: entity_types || ["project", "portfolio", "contact", "company", "deal"],
        limit_per_type: limit,
      },
    })
  } catch (error) {
    console.error("Global search error:", error)
    return res.status(500).json({
      message: "Search failed",
      error: error.message,
    })
  }
}
