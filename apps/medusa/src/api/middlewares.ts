import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  authenticate,
} from "@medusajs/framework/http"
import { TEAM_MODULE } from "@/modules/team"
import TeamModuleService from "@/modules/team/service"

/**
 * Team context middleware
 * Injects team_id from query/body/headers into the request for team isolation
 */
function teamContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Extract team_id from various sources (priority: body > query > header)
  const teamId =
    (req.body as any)?.team_id ||
    req.query.team_id ||
    req.headers["x-team-id"]

  if (teamId) {
    // Attach team_id to request scope for use in routes/workflows
    ;(req as any).team_id = teamId
  }

  next()
}

/**
 * Team member validation middleware
 * Validates that the authenticated user is a member of the requested team
 */
async function validateTeamMemberMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const teamId = (req as any).team_id
  const userId = (req as any).auth_context?.actor_id

  if (!teamId) {
    return res.status(400).json({
      error: "Missing team_id in request",
    })
  }

  if (!userId) {
    return res.status(401).json({
      error: "User not authenticated",
    })
  }

  try {
    const teamModuleService: TeamModuleService = req.scope.resolve(TEAM_MODULE)

    // Check if user is a member of this team
    const teamMembers = await teamModuleService.listTeamMembers({
      filters: {
        team_id: teamId,
        user_id: userId,
      },
    })

    if (!teamMembers || (Array.isArray(teamMembers) && teamMembers.length === 0)) {
      return res.status(403).json({
        error: "User is not a member of this team",
      })
    }

    const teamMember = Array.isArray(teamMembers) ? teamMembers[0] : teamMembers

    // Attach team member info to request
    ;(req as any).team_member = teamMember

    next()
  } catch (error) {
    console.error("Team validation error:", error)
    return res.status(500).json({
      error: "Failed to validate team membership",
    })
  }
}

export default defineMiddlewares({
  routes: [
    // Protect admin team routes
    {
      matcher: "/admin/teams*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    // Inject team context for team-specific routes
    {
      matcher: "/admin/teams/:id/*",
      middlewares: [teamContextMiddleware],
    },
    // Validate team membership for member operations
    {
      matcher: "/admin/teams/:id/members*",
      middlewares: [validateTeamMemberMiddleware],
    },
  ],
})
