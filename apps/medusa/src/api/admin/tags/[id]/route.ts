import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

// Validation schema
const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  entity_types: z.array(z.enum(["project", "portfolio", "contact", "company", "deal"])).optional(),
})

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const team_id = req.auth_context?.team_id || req.query.team_id as string

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const tagModuleService = req.scope.resolve("tagModuleService")

    // Get tag
    const tag = await tagModuleService.retrieveTag(id)

    // Verify tag belongs to team
    if (tag.team_id !== team_id) {
      return res.status(404).json({
        message: "Tag not found",
      })
    }

    return res.json({ tag })
  } catch (error) {
    console.error("Get tag error:", error)
    return res.status(500).json({
      message: "Failed to get tag",
      error: error.message,
    })
  }
}

export const PATCH = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const team_id = req.auth_context?.team_id || req.body.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = updateTagSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid tag data",
        errors: parsed.error.errors,
      })
    }

    const tagModuleService = req.scope.resolve("tagModuleService")

    // Get tag to verify ownership
    const tag = await tagModuleService.retrieveTag(id)

    if (tag.team_id !== team_id) {
      return res.status(404).json({
        message: "Tag not found",
      })
    }

    // Update tag
    const updatedTag = await tagModuleService.updateTags({
      id,
      ...parsed.data,
    })

    return res.json({ tag: updatedTag })
  } catch (error) {
    console.error("Update tag error:", error)

    // Handle unique constraint violation
    if (error.code === "23505" || error.message.includes("unique")) {
      return res.status(409).json({
        message: "A tag with this name already exists for your team",
      })
    }

    return res.status(500).json({
      message: "Failed to update tag",
      error: error.message,
    })
  }
}

export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const team_id = req.auth_context?.team_id || req.query.team_id as string

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const tagModuleService = req.scope.resolve("tagModuleService")

    // Get tag to verify ownership
    const tag = await tagModuleService.retrieveTag(id)

    if (tag.team_id !== team_id) {
      return res.status(404).json({
        message: "Tag not found",
      })
    }

    // Delete tag (this will also remove all entity-tag associations via module links)
    await tagModuleService.deleteTags(id)

    return res.status(204).send()
  } catch (error) {
    console.error("Delete tag error:", error)
    return res.status(500).json({
      message: "Failed to delete tag",
      error: error.message,
    })
  }
}
