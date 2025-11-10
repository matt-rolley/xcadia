import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").default("#3B82F6"),
  entity_types: z.array(z.enum(["project", "portfolio", "contact", "company", "deal"])).optional(),
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Validate request body
    const parsed = createTagSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid tag data",
        errors: parsed.error.errors,
      })
    }

    // Get team_id from auth context
    const team_id = req.auth_context?.team_id || req.body.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Get user_id from auth context
    const created_by = req.auth_context?.actor_id || req.body.user_id

    const tagModuleService = req.scope.resolve("tagModuleService")

    // Create tag
    const tag = await tagModuleService.createTags({
      team_id,
      name: parsed.data.name,
      color: parsed.data.color,
      entity_types: parsed.data.entity_types || ["project", "portfolio", "contact", "company", "deal"],
      created_by,
    })

    return res.status(201).json({ tag })
  } catch (error) {
    console.error("Create tag error:", error)

    // Handle unique constraint violation
    if (error.code === "23505" || error.message.includes("unique")) {
      return res.status(409).json({
        message: "A tag with this name already exists for your team",
      })
    }

    return res.status(500).json({
      message: "Failed to create tag",
      error: error.message,
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get team_id from auth context
    const team_id = req.auth_context?.team_id || req.query.team_id as string

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const tagModuleService = req.scope.resolve("tagModuleService")

    // List all tags for team
    const tags = await tagModuleService.listTags({
      filters: { team_id },
      order: { name: "ASC" },
    })

    return res.json({
      tags,
      count: tags.length,
    })
  } catch (error) {
    console.error("List tags error:", error)
    return res.status(500).json({
      message: "Failed to list tags",
      error: error.message,
    })
  }
}
