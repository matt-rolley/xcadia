import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BoltSolid } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Input, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Activity = {
  id: string
  user_id?: string
  user_email?: string
  entity_type: string
  entity_id: string
  action: string
  metadata?: Record<string, any>
  occurred_at: string
}

const ActivityLogPage = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    entity_type: "",
    action: "",
    user_id: "",
    search: "",
  })

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const params = new URLSearchParams()
        if (filters.entity_type) params.append("entity_type", filters.entity_type)
        if (filters.action) params.append("action", filters.action)
        if (filters.user_id) params.append("user_id", filters.user_id)
        if (filters.search) params.append("search", filters.search)

        const response = await fetch(`/admin/activities?${params.toString()}`, {
          credentials: "include",
        })
        const data = await response.json()
        setActivities(data.activities || [])
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [filters])

  const getActionColor = (action: string): "green" | "blue" | "red" | "purple" | "orange" | "grey" => {
    const colors: Record<string, "green" | "blue" | "red" | "purple" | "orange" | "grey"> = {
      created: "green",
      updated: "blue",
      deleted: "red",
      sent: "purple",
      viewed: "orange",
      opened: "blue",
      clicked: "orange",
      invited: "green",
      joined: "green",
      left: "red",
    }
    return colors[action] || "grey"
  }

  const getEntityTypeIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      project: "📁",
      portfolio: "🎨",
      contact: "👤",
      company: "🏢",
      deal: "💼",
      team: "👥",
      email: "📧",
    }
    return icons[entityType] || "📋"
  }

  const getEntityLink = (activity: Activity) => {
    const links: Record<string, string> = {
      project: `/projects/${activity.entity_id}`,
      portfolio: `/portfolios/${activity.entity_id}`,
      contact: `/contacts/${activity.entity_id}`,
      company: `/companies/${activity.entity_id}`,
      deal: `/deals/${activity.entity_id}`,
      team: `/settings/team`,
      email: `/emails`,
    }
    return links[activity.entity_type]
  }

  const formatMetadata = (metadata?: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    return (
      <div className="text-xs text-ui-fg-subtle mt-1">
        {Object.entries(metadata).slice(0, 3).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span>{" "}
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </div>
        ))}
        {Object.keys(metadata).length > 3 && (
          <div className="text-ui-fg-muted">
            +{Object.keys(metadata).length - 3} more
          </div>
        )}
      </div>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <Heading level="h1">Activity Log</Heading>
        <p className="text-sm text-ui-fg-subtle mt-1">
          View all user activities and system events across your workspace
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
          <div>
            <Select
              value={filters.entity_type}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, entity_type: value }))
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="Filter by type" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">All Types</Select.Item>
                <Select.Item value="project">Project</Select.Item>
                <Select.Item value="portfolio">Portfolio</Select.Item>
                <Select.Item value="contact">Contact</Select.Item>
                <Select.Item value="company">Company</Select.Item>
                <Select.Item value="deal">Deal</Select.Item>
                <Select.Item value="team">Team</Select.Item>
                <Select.Item value="email">Email</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Select
              value={filters.action}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, action: value }))
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="Filter by action" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">All Actions</Select.Item>
                <Select.Item value="created">Created</Select.Item>
                <Select.Item value="updated">Updated</Select.Item>
                <Select.Item value="deleted">Deleted</Select.Item>
                <Select.Item value="sent">Sent</Select.Item>
                <Select.Item value="viewed">Viewed</Select.Item>
                <Select.Item value="opened">Opened</Select.Item>
                <Select.Item value="clicked">Clicked</Select.Item>
                <Select.Item value="invited">Invited</Select.Item>
                <Select.Item value="joined">Joined</Select.Item>
                <Select.Item value="left">Left</Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-2">No activities found</p>
            <p className="text-sm text-ui-fg-muted">
              Try adjusting your filters or wait for activities to be logged
            </p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Time</Table.HeaderCell>
                <Table.HeaderCell>User</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
                <Table.HeaderCell>Entity</Table.HeaderCell>
                <Table.HeaderCell>Details</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {activities.map((activity) => (
                <Table.Row key={activity.id}>
                  <Table.Cell>
                    <div className="text-sm">
                      {new Date(activity.occurred_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-ui-fg-subtle">
                      {formatRelativeTime(activity.occurred_at)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {activity.user_email ? (
                      <div>
                        <div className="text-sm font-medium">
                          {activity.user_email}
                        </div>
                        <div className="text-xs text-ui-fg-subtle">
                          {activity.user_id}
                        </div>
                      </div>
                    ) : (
                      <span className="text-ui-fg-subtle text-sm">System</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={getActionColor(activity.action)}>
                      {activity.action}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span>{getEntityTypeIcon(activity.entity_type)}</span>
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {activity.entity_type}
                        </div>
                        {getEntityLink(activity) ? (
                          <Link
                            to={getEntityLink(activity)!}
                            className="text-xs text-ui-fg-interactive hover:underline"
                          >
                            View {activity.entity_type}
                          </Link>
                        ) : (
                          <div className="text-xs text-ui-fg-subtle">
                            ID: {activity.entity_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {formatMetadata(activity.metadata)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-ui-fg-subtle">Total Activities</p>
            <p className="text-2xl font-semibold">{activities.length}</p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle">Unique Users</p>
            <p className="text-2xl font-semibold">
              {new Set(activities.map((a) => a.user_id).filter(Boolean)).size}
            </p>
          </div>
          <div>
            <p className="text-sm text-ui-fg-subtle">Last Activity</p>
            <p className="text-sm font-semibold">
              {activities.length > 0
                ? formatRelativeTime(activities[0].occurred_at)
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export const config = defineRouteConfig({
  label: "Activity Log",
  icon: BoltSolid,
})

export default ActivityLogPage
