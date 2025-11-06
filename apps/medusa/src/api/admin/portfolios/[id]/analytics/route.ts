import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PORTFOLIO_MODULE } from "@/modules/portfolio"

// GET /admin/portfolios/:id/analytics - Get email analytics for a specific portfolio
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id: portfolio_id } = req.params
  const teamId = (req as any).team_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const portfolioModuleService = req.scope.resolve(PORTFOLIO_MODULE)

  try {
    // First, verify the portfolio belongs to the user's team
    const portfolio = await portfolioModuleService.retrievePortfolio(portfolio_id)

    if (portfolio.team_id !== teamId) {
      res.status(403).json({ error: "Forbidden: Portfolio does not belong to your team" })
      return
    }

    // Fetch all portfolio emails for this portfolio with events
    const { data: portfolioEmails } = await query.graph({
      entity: "portfolio_email",
      fields: [
        "*",
        "contact.*",
        "contact.company.*",
        "events.*",
      ],
      filters: { portfolio_id },
    })

    // Calculate aggregate statistics
    const stats = {
      total_sent: portfolioEmails?.length || 0,
      total_opened: 0,
      total_clicked: 0,
      total_bounced: 0,
      unique_contacts: new Set(),
      open_rate: 0,
      click_rate: 0,
      bounce_rate: 0,
      events_by_type: {
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
      },
    }

    // Calculate stats from portfolio emails
    portfolioEmails?.forEach((email: any) => {
      if (email.opened_at) stats.total_opened++
      if (email.clicked_at) stats.total_clicked++
      if (email.bounced_at) stats.total_bounced++
      if (email.contact_id) stats.unique_contacts.add(email.contact_id)

      // Count events by type
      email.events?.forEach((event: any) => {
        if (stats.events_by_type[event.event_type as keyof typeof stats.events_by_type] !== undefined) {
          stats.events_by_type[event.event_type as keyof typeof stats.events_by_type]++
        }
      })
    })

    // Calculate rates
    if (stats.total_sent > 0) {
      stats.open_rate = (stats.total_opened / stats.total_sent) * 100
      stats.click_rate = (stats.total_clicked / stats.total_sent) * 100
      stats.bounce_rate = (stats.total_bounced / stats.total_sent) * 100
    }

    // Group emails by contact
    const emailsByContact = portfolioEmails?.reduce((acc: any, email: any) => {
      const contactId = email.contact_id
      if (!acc[contactId]) {
        acc[contactId] = {
          contact: email.contact,
          emails: [],
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
        }
      }
      acc[contactId].emails.push(email)
      acc[contactId].total_sent++
      if (email.opened_at) acc[contactId].total_opened++
      if (email.clicked_at) acc[contactId].total_clicked++
      return acc
    }, {})

    res.json({
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
      },
      stats: {
        ...stats,
        unique_contacts: stats.unique_contacts.size,
      },
      emails: portfolioEmails || [],
      emails_by_contact: emailsByContact || {},
    })
  } catch (error) {
    console.error("Failed to fetch portfolio analytics:", error)
    res.status(500).json({
      error: "Failed to fetch portfolio analytics",
    })
  }
}
