import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

const updateDomainSchema = z.object({
  from_name: z.string().min(1).optional(),
  from_email: z.string().email().optional(),
  enabled: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

/**
 * GET /admin/email-domains/[id]
 * Get email domain by ID
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const domain_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    const domain = await emailDomainModuleService.retrieveEmailDomain(domain_id)

    // Verify team ownership
    if (domain.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    return res.json({ domain })
  } catch (error: any) {
    console.error("Get email domain error:", error)
    return res.status(500).json({
      message: "Failed to get email domain",
      error: error.message,
    })
  }
}

/**
 * PUT /admin/email-domains/[id]
 * Update email domain
 */
export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const domain_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = updateDomainSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    // Verify team ownership
    const existing = await emailDomainModuleService.retrieveEmailDomain(domain_id)
    if (existing.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    // If setting as default, unset other defaults
    if (parsed.data.is_default === true) {
      const otherDomains = await emailDomainModuleService.listEmailDomains({
        filters: {
          team_id,
          is_default: true,
        },
      })

      for (const domain of otherDomains) {
        if (domain.id !== domain_id) {
          await emailDomainModuleService.updateEmailDomains({
            id: domain.id,
            is_default: false,
          })
        }
      }
    }

    const domain = await emailDomainModuleService.updateEmailDomains({
      id: domain_id,
      ...parsed.data,
    })

    return res.json({
      message: "Email domain updated",
      domain,
    })
  } catch (error: any) {
    console.error("Update email domain error:", error)
    return res.status(500).json({
      message: "Failed to update email domain",
      error: error.message,
    })
  }
}

/**
 * DELETE /admin/email-domains/[id]
 * Delete email domain
 */
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const domain_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    // Verify team ownership
    const domain = await emailDomainModuleService.retrieveEmailDomain(domain_id)
    if (domain.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    // Prevent deletion of default domain
    if (domain.is_default) {
      return res.status(400).json({
        message: "Cannot delete default domain. Set another domain as default first.",
      })
    }

    await emailDomainModuleService.deleteEmailDomains(domain_id)

    return res.json({
      message: "Email domain deleted successfully",
      id: domain_id,
    })
  } catch (error: any) {
    console.error("Delete email domain error:", error)
    return res.status(500).json({
      message: "Failed to delete email domain",
      error: error.message,
    })
  }
}
