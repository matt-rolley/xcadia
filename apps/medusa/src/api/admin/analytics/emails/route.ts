import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /admin/analytics/emails - Get email analytics for the team
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const teamId = (req as any).team_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Query parameters for filtering
  const {
    portfolio_id,
    contact_id,
    from_date,
    to_date,
    limit = 50,
    offset = 0,
  } = req.query

  try {
    // Build filters
    const filters: any = {}

    if (portfolio_id) {
      filters.portfolio_id = portfolio_id
    }

    if (contact_id) {
      filters.contact_id = contact_id
    }

    if (from_date) {
      filters.sent_at = { $gte: new Date(from_date as string) }
    }

    if (to_date) {
      filters.sent_at = {
        ...filters.sent_at,
        $lte: new Date(to_date as string),
      }
    }

    // Fetch portfolio emails with linked portfolio data to filter by team
    const { data: portfolioEmails } = await query.graph({
      entity: "portfolio_email",
      fields: [
        "*",
        "portfolio.*",
        "contact.*",
        "contact.company.*",
        "events.*",
      ],
      filters,
      pagination: {
        skip: Number(offset),
        take: Number(limit),
      },
    })

    // Filter by team (since portfolio has team_id)
    const teamFilteredEmails = portfolioEmails?.filter(
      (email: any) => email.portfolio?.team_id === teamId
    ) || []

    // Calculate aggregate statistics
    const stats = {
      total_sent: teamFilteredEmails.length,
      total_opened: teamFilteredEmails.filter((e: any) => e.opened_at).length,
      total_clicked: teamFilteredEmails.filter((e: any) => e.clicked_at).length,
      total_bounced: teamFilteredEmails.filter((e: any) => e.bounced_at).length,
      open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
    }

    if (stats.total_sent > 0) {
      stats.open_rate = (stats.total_opened / stats.total_sent) * 100
      stats.click_rate = (stats.total_clicked / stats.total_sent) * 100
      stats.bounce_rate = (stats.total_bounced / stats.total_sent) * 100
    }

    res.json({
      stats,
      emails: teamFilteredEmails,
      pagination: {
        offset: Number(offset),
        limit: Number(limit),
        total: teamFilteredEmails.length,
      },
    })
  } catch (error) {
    console.error("Failed to fetch email analytics:", error)
    res.status(500).json({
      error: "Failed to fetch email analytics",
    })
  }
}
