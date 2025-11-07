import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { globalSearchWorkflow } from "@/workflows/search/global-search"

// GET /admin/search?q={query}&type={entity_types} - Global search across entities
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const teamId = (req as any).team_id
  const { q, type, limit = 10 } = req.query

  if (!q || typeof q !== "string") {
    res.status(400).json({
      error: "Query parameter 'q' is required",
    })
    return
  }

  if (!teamId) {
    res.status(401).json({
      error: "Team context required",
    })
    return
  }

  try {
    // Parse entity types filter
    let entityTypes: string[] | undefined
    if (type) {
      entityTypes = typeof type === "string" ? type.split(",") : []
    }

    // Execute search workflow
    const { result } = await globalSearchWorkflow(req.scope).run({
      input: {
        query: q,
        team_id: teamId,
        entity_types: entityTypes,
        limit: Number(limit),
      },
    })

    res.json({
      query: q,
      results: result,
    })
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({
      error: "Search failed",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
