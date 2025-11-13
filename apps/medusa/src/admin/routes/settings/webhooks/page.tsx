import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Label, Input, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Trash } from "@medusajs/icons"

type Webhook = {
  id: string
  url: string
  events: string[]
  auth_type: string
  is_active: boolean
  success_count: number
  failure_count: number
  last_triggered_at?: string
  created_at: string
}

const WebhooksPage = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    url: "",
    events: [] as string[],
    auth_type: "none",
    auth_config: {} as any,
  })

  const availableEvents = [
    "company.created",
    "company.updated",
    "contact.created",
    "contact.updated",
    "deal.created",
    "deal.updated",
    "deal.won",
    "deal.lost",
    "email.sent",
    "email.opened",
    "email.clicked",
  ]

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/admin/webhooks", {
        credentials: "include",
      })
      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (error) {
      console.error("Failed to fetch webhooks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await fetch("/admin/webhooks", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      setShowForm(false)
      setFormData({ url: "", events: [], auth_type: "none", auth_config: {} })
      fetchWebhooks()
    } catch (error) {
      console.error("Failed to create webhook:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return

    try {
      await fetch(`/admin/webhooks/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchWebhooks()
    } catch (error) {
      console.error("Failed to delete webhook:", error)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/admin/webhooks/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !isActive }),
      })
      fetchWebhooks()
    } catch (error) {
      console.error("Failed to toggle webhook:", error)
    }
  }

  const handleTest = async (id: string) => {
    try {
      await fetch(`/admin/webhooks/${id}/test`, {
        method: "POST",
        credentials: "include",
      })
      alert("Test webhook sent successfully")
    } catch (error) {
      console.error("Failed to test webhook:", error)
      alert("Failed to send test webhook")
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Webhooks</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Configure webhooks to receive real-time notifications
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Webhook"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="px-6 py-4 bg-ui-bg-subtle">
          <Heading level="h2" className="mb-4">New Webhook</Heading>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-domain.com/webhook"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div>
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, events: [...formData.events, event] })
                        } else {
                          setFormData({
                            ...formData,
                            events: formData.events.filter((e) => e !== event),
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Authentication Type</Label>
              <Select
                value={formData.auth_type}
                onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="none">None</Select.Item>
                  <Select.Item value="bearer">Bearer Token</Select.Item>
                  <Select.Item value="basic">Basic Auth</Select.Item>
                  <Select.Item value="custom">Custom Header</Select.Item>
                </Select.Content>
              </Select>
            </div>

            {formData.auth_type === "bearer" && (
              <div>
                <Label>Bearer Token</Label>
                <Input
                  type="password"
                  value={formData.auth_config.token || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      auth_config: { token: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {formData.auth_type === "basic" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={formData.auth_config.username || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, username: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.auth_config.password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auth_config: { ...formData.auth_config, password: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <Button onClick={handleCreate}>Create Webhook</Button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No webhooks configured</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>URL</Table.HeaderCell>
                <Table.HeaderCell>Events</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Success / Failure</Table.HeaderCell>
                <Table.HeaderCell>Last Triggered</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {webhooks.map((webhook) => (
                <Table.Row key={webhook.id}>
                  <Table.Cell>
                    <p className="text-sm font-mono">{webhook.url}</p>
                    <Badge size="2xsmall" className="mt-1">{webhook.auth_type}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map((event) => (
                        <Badge key={event} size="2xsmall">{event}</Badge>
                      ))}
                      {webhook.events.length > 3 && (
                        <Badge size="2xsmall">+{webhook.events.length - 3} more</Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={webhook.is_active ? "green" : "red"}>
                      {webhook.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-green-600">{webhook.success_count}</span> /{" "}
                    <span className="text-red-600">{webhook.failure_count}</span>
                  </Table.Cell>
                  <Table.Cell>
                    {webhook.last_triggered_at
                      ? new Date(webhook.last_triggered_at).toLocaleString()
                      : "Never"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleToggle(webhook.id, webhook.is_active)}
                      >
                        {webhook.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleTest(webhook.id)}
                      >
                        Test
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Webhooks",
})

export default WebhooksPage
