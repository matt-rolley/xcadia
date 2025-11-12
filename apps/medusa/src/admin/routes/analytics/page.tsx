import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Badge, Table } from "@medusajs/ui"
import { useEffect, useState } from "react"

type DashboardData = {
  total_events: number
  active_users_30d: number
  top_events: Array<{ event_type: string; count: number }>
  daily_timeline: Array<{ date: string; count: number }>
  email_metrics: {
    open_rate: number
    click_rate: number
    total_sent: number
    total_opened: number
    total_clicked: number
  }
  deal_metrics: {
    win_rate: number
    total_deals: number
    won_deals: number
    lost_deals: number
    avg_deal_value: number
  }
  top_countries: Array<{ country: string; count: number }>
  top_devices: Array<{ device_type: string; count: number }>
}

const AnalyticsPage = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/admin/analytics/dashboard", {
          credentials: "include",
        })
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading analytics...</p>
        </div>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Failed to load analytics</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <Heading level="h1">Analytics Dashboard</Heading>
        <p className="text-sm text-ui-fg-subtle mt-1">
          Track user activity, email campaigns, and deal performance
        </p>
      </div>

      {/* Overview Stats */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Overview</Heading>
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Total Events</p>
            <p className="text-2xl font-semibold">{data.total_events.toLocaleString()}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Active Users (30d)</p>
            <p className="text-2xl font-semibold">{data.active_users_30d.toLocaleString()}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Email Open Rate</p>
            <p className="text-2xl font-semibold">{data.email_metrics.open_rate.toFixed(1)}%</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Deal Win Rate</p>
            <p className="text-2xl font-semibold">{data.deal_metrics.win_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Email Metrics */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Email Campaign Performance</Heading>
        <div className="grid grid-cols-5 gap-4">
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Total Sent</p>
            <p className="text-xl font-semibold">{data.email_metrics.total_sent.toLocaleString()}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Opened</p>
            <p className="text-xl font-semibold">{data.email_metrics.total_opened.toLocaleString()}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Clicked</p>
            <p className="text-xl font-semibold">{data.email_metrics.total_clicked.toLocaleString()}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Open Rate</p>
            <p className="text-xl font-semibold">{data.email_metrics.open_rate.toFixed(1)}%</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Click Rate</p>
            <p className="text-xl font-semibold">{data.email_metrics.click_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Deal Metrics */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Deal Performance</Heading>
        <div className="grid grid-cols-5 gap-4">
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Total Deals</p>
            <p className="text-xl font-semibold">{data.deal_metrics.total_deals}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4 bg-green-50">
            <p className="text-sm text-ui-fg-subtle mb-1">Won</p>
            <p className="text-xl font-semibold text-green-600">{data.deal_metrics.won_deals}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4 bg-red-50">
            <p className="text-sm text-ui-fg-subtle mb-1">Lost</p>
            <p className="text-xl font-semibold text-red-600">{data.deal_metrics.lost_deals}</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Win Rate</p>
            <p className="text-xl font-semibold">{data.deal_metrics.win_rate.toFixed(1)}%</p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4">
            <p className="text-sm text-ui-fg-subtle mb-1">Avg Deal Value</p>
            <p className="text-xl font-semibold">${data.deal_metrics.avg_deal_value.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Top Events</Heading>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Event Type</Table.HeaderCell>
              <Table.HeaderCell>Count</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.top_events.slice(0, 10).map((event) => (
              <Table.Row key={event.event_type}>
                <Table.Cell>
                  <Badge size="small">{event.event_type}</Badge>
                </Table.Cell>
                <Table.Cell>{event.count.toLocaleString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Geographic Distribution */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Heading level="h2" className="mb-4">Top Countries</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Country</Table.HeaderCell>
                  <Table.HeaderCell>Count</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.top_countries.slice(0, 10).map((country) => (
                  <Table.Row key={country.country}>
                    <Table.Cell>{country.country || "Unknown"}</Table.Cell>
                    <Table.Cell>{country.count.toLocaleString()}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>

          <div>
            <Heading level="h2" className="mb-4">Device Types</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Device</Table.HeaderCell>
                  <Table.HeaderCell>Count</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.top_devices.map((device) => (
                  <Table.Row key={device.device_type}>
                    <Table.Cell>
                      <Badge size="small">{device.device_type || "Unknown"}</Badge>
                    </Table.Cell>
                    <Table.Cell>{device.count.toLocaleString()}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Activity Timeline (Last 30 Days)</Heading>
        <div className="flex items-end gap-2 h-48">
          {data.daily_timeline.map((day) => {
            const maxCount = Math.max(...data.daily_timeline.map((d) => d.count))
            const height = (day.count / maxCount) * 100

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${day.count} events on ${new Date(day.date).toLocaleDateString()}`}
                />
                <p className="text-xs text-ui-fg-subtle transform -rotate-45 origin-top-left mt-2">
                  {new Date(day.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
})

export default AnalyticsPage
