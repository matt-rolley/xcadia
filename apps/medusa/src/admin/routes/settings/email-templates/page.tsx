import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/admin/email-templates", {
          credentials: "include",
        })
        const data = await response.json()
        setTemplates(data.email_templates || [])
      } catch (error) {
        console.error("Failed to fetch email templates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/admin/email-templates/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      })

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_active: !currentStatus } : t
        )
      )
    } catch (error) {
      console.error("Failed to toggle template status:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      await fetch(`/admin/email-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Failed to delete template:", error)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Email Templates</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Create and manage email templates for campaigns and notifications
          </p>
        </div>
        <Link to="/settings/email-templates/new">
          <Button variant="primary">Create Template</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No templates created yet</p>
            <Link to="/settings/email-templates/new">
              <Button variant="secondary">Create Your First Template</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Variables</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Updated</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {templates.map((template) => (
                <Table.Row key={template.id}>
                  <Table.Cell>
                    <Link
                      to={`settings/email-templates/${template.id}`}
                      className="text-ui-fg-interactive hover:underline"
                    >
                      {template.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell className="max-w-md truncate">
                    {template.subject}
                  </Table.Cell>
                  <Table.Cell>
                    {template.variables && Object.keys(template.variables).length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {Object.keys(template.variables).slice(0, 3).map((key) => (
                          <Badge key={key} size="2xsmall" color="grey">
                            {key}
                          </Badge>
                        ))}
                        {Object.keys(template.variables).length > 3 && (
                          <Badge size="2xsmall" color="grey">
                            +{Object.keys(template.variables).length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-ui-fg-subtle text-sm">None</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="small"
                      color={template.is_active ? "green" : "grey"}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(template.updated_at).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          handleToggleActive(template.id, template.is_active)
                        }
                      >
                        {template.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Link to={`settings/email-templates/${template.id}`}>
                        <Button variant="secondary" size="small">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleDelete(template.id)}
                      >
                        Delete
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
  label: "Email Templates",
})

export default EmailTemplatesPage
