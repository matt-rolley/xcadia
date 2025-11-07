import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import { TEAM_MODULE } from "@/modules/team"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Middleware to attach team context to request
 * Resolves the user's active team and sets req.team_id for multi-tenancy
 */
async function attachTeamContext(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    // Get authenticated user ID from auth context
    const userId = (req as any).auth_context?.actor_id

    if (!userId) {
      // No authenticated user, skip team context
      return next()
    }

    const teamModuleService = req.scope.resolve(TEAM_MODULE)

    // Get user's team memberships
    const teamMembers = await teamModuleService.listTeamMembers({
      user_id: userId,
    })

    if (!teamMembers || teamMembers.length === 0) {
      // User is not a member of any team
      logger.warn(`User ${userId} has no team memberships`)
      return next()
    }

    // For now, use the first team (primary team)
    // TODO: Support team switching via header/query param
    const primaryTeam = teamMembers[0]

    // Attach team_id to request for downstream use
    ;(req as any).team_id = primaryTeam.team_id

    logger.debug(`Team context attached: user ${userId} -> team ${primaryTeam.team_id}`)

    next()
  } catch (error) {
    logger.error("Error attaching team context:", error)
    // Don't block request on middleware error
    next()
  }
}

/**
 * Define middleware routes
 * Apply team context to all admin routes that need multi-tenancy
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/activity*",
      middlewares: [attachTeamContext],
    },
    {
      matcher: "/admin/notifications*",
      middlewares: [attachTeamContext],
    },
    {
      matcher: "/admin/projects*",
      middlewares: [attachTeamContext],
    },
    {
      matcher: "/admin/portfolios*",
      middlewares: [attachTeamContext],
    },
    {
      matcher: "/admin/companies*",
      middlewares: [attachTeamContext],
    },
    {
      matcher: "/admin/teams*",
      middlewares: [attachTeamContext],
    },
  ],
})
