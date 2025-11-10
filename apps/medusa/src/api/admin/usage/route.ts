import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

    const usageModuleService = req.scope.resolve("usageModuleService")

    // Get current usage tracker for team
    const usageTrackers = await usageModuleService.listUsageTrackers({
      filters: {
        team_id,
        period_end: { $gte: new Date() }, // Current period
      },
      take: 1,
    })

    if (!usageTrackers || usageTrackers.length === 0) {
      return res.status(404).json({
        message: "No active usage tracker found for team",
      })
    }

    const usage = usageTrackers[0]

    // Calculate usage percentages
    const storagePercentage = (usage.storage_gb / usage.storage_limit_gb) * 100
    const projectPercentage = (usage.project_count / usage.project_limit) * 100
    const emailPercentage = (usage.email_count / usage.email_limit) * 100

    // Determine status (ok, warning, critical)
    const getStatus = (percentage: number) => {
      if (percentage >= 100) return "critical"
      if (percentage >= 80) return "warning"
      return "ok"
    }

    return res.json({
      usage: {
        storage: {
          current: usage.storage_gb,
          limit: usage.storage_limit_gb,
          percentage: Math.round(storagePercentage),
          status: getStatus(storagePercentage),
        },
        projects: {
          current: usage.project_count,
          limit: usage.project_limit,
          percentage: Math.round(projectPercentage),
          status: getStatus(projectPercentage),
        },
        emails: {
          current: usage.email_count,
          limit: usage.email_limit,
          percentage: Math.round(emailPercentage),
          status: getStatus(emailPercentage),
        },
        portfolio_views: {
          current: usage.portfolio_view_count,
          // No limit for views
        },
      },
      plan: {
        name: usage.plan_name,
        price: usage.plan_price,
      },
      billing_period: {
        start: usage.period_start,
        end: usage.period_end,
      },
    })
  } catch (error) {
    console.error("Get usage error:", error)
    return res.status(500).json({
      message: "Failed to get usage data",
      error: error.message,
    })
  }
}
