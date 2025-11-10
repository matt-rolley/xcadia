import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/analytics/dashboard
 * Get analytics dashboard data for team
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const analyticsModuleService = req.scope.resolve("analyticsModuleService")

    // Get date range from query params (default: last 30 days)
    const days = parseInt(req.query.days as string) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all analytics events for the period
    const events = await analyticsModuleService.listAnalyticsEvents({
      filters: {
        team_id,
        created_at: { $gte: startDate },
      },
      order: { created_at: "DESC" },
    })

    // Calculate metrics
    const totalEvents = events.length

    // Events by category
    const eventsByCategory = events.reduce((acc: any, event: any) => {
      acc[event.event_category] = (acc[event.event_category] || 0) + 1
      return acc
    }, {})

    // Top event types
    const eventTypeCounts = events.reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {})

    const topEvents = Object.entries(eventTypeCounts)
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    // Active users (unique user_ids)
    const activeUsers = new Set(
      events.filter((e: any) => e.user_id).map((e: any) => e.user_id)
    ).size

    // Events by day (for chart)
    const eventsByDay: Record<string, number> = {}
    events.forEach((event: any) => {
      const date = new Date(event.created_at).toISOString().split("T")[0]
      eventsByDay[date] = (eventsByDay[date] || 0) + 1
    })

    const dailyEvents = Object.entries(eventsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Device breakdown
    const deviceCounts = events.reduce((acc: any, event: any) => {
      const device = event.device_type || "unknown"
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    // Geographic breakdown
    const countryCounts = events.reduce((acc: any, event: any) => {
      if (event.country) {
        acc[event.country] = (acc[event.country] || 0) + 1
      }
      return acc
    }, {})

    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    // Portfolio metrics
    const portfolioEvents = events.filter((e: any) =>
      e.event_category === "portfolio"
    )
    const portfolioViews = events.filter((e: any) =>
      e.event_type === "portfolio.viewed"
    ).length
    const portfolioSends = events.filter((e: any) =>
      e.event_type === "portfolio.sent"
    ).length

    // Email metrics
    const emailEvents = events.filter((e: any) =>
      e.event_category === "email"
    )
    const emailsSent = events.filter((e: any) =>
      e.event_type === "email.sent"
    ).length
    const emailsOpened = events.filter((e: any) =>
      e.event_type === "email.opened"
    ).length
    const emailsClicked = events.filter((e: any) =>
      e.event_type === "email.clicked"
    ).length

    const emailOpenRate = emailsSent > 0
      ? Math.round((emailsOpened / emailsSent) * 100)
      : 0
    const emailClickRate = emailsSent > 0
      ? Math.round((emailsClicked / emailsSent) * 100)
      : 0

    // Deal metrics
    const dealEvents = events.filter((e: any) =>
      e.event_category === "deal"
    )
    const dealsCreated = events.filter((e: any) =>
      e.event_type === "deal.created"
    ).length
    const dealsWon = events.filter((e: any) =>
      e.event_type === "deal.won"
    ).length
    const dealsLost = events.filter((e: any) =>
      e.event_type === "deal.lost"
    ).length

    const dealWinRate = (dealsWon + dealsLost) > 0
      ? Math.round((dealsWon / (dealsWon + dealsLost)) * 100)
      : 0

    return res.json({
      period: {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        days,
      },
      overview: {
        total_events: totalEvents,
        active_users: activeUsers,
        events_by_category: eventsByCategory,
      },
      top_events: topEvents,
      daily_events: dailyEvents,
      devices: deviceCounts,
      geographic: {
        top_countries: topCountries,
      },
      portfolio_metrics: {
        total_events: portfolioEvents.length,
        views: portfolioViews,
        sends: portfolioSends,
      },
      email_metrics: {
        total_events: emailEvents.length,
        sent: emailsSent,
        opened: emailsOpened,
        clicked: emailsClicked,
        open_rate: emailOpenRate,
        click_rate: emailClickRate,
      },
      deal_metrics: {
        total_events: dealEvents.length,
        created: dealsCreated,
        won: dealsWon,
        lost: dealsLost,
        win_rate: dealWinRate,
      },
    })
  } catch (error: any) {
    console.error("Get analytics dashboard error:", error)
    return res.status(500).json({
      message: "Failed to get analytics dashboard",
      error: error.message,
    })
  }
}
