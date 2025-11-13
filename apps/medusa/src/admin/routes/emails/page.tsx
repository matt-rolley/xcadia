import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EnvelopeOpen } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Email = {
  id: string
  subject: string
  to_email: string
  status: string
  opened_at?: string
  clicked_at?: string
  sent_at: string
  created_at: string
}

const EmailsPage = () => {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch("/admin/emails", {
          credentials: "include",
        })
        const data = await response.json()
        setEmails(data.emails || [])
      } catch (error) {
        console.error("Failed to fetch emails:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmails()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: "blue",
      delivered: "green",
      opened: "purple",
      clicked: "orange",
      bounced: "red",
      failed: "red",
    }
    return colors[status] || "gray"
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Email Campaigns</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Track and manage email campaign deliverability
          </p>
        </div>
        <Link to="/app/emails/new">
          <Button variant="secondary">Send Email</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No emails sent yet</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>To</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Sent</Table.HeaderCell>
                <Table.HeaderCell>Opened</Table.HeaderCell>
                <Table.HeaderCell>Clicked</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {emails.map((email) => (
                <Table.Row key={email.id}>
                  <Table.Cell>{email.subject}</Table.Cell>
                  <Table.Cell>{email.to_email}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={getStatusColor(email.status)}>
                      {email.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {email.sent_at
                      ? new Date(email.sent_at).toLocaleString()
                      : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    {email.opened_at ? (
                      <Badge size="2xsmall" color="green">
                        {new Date(email.opened_at).toLocaleString()}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {email.clicked_at ? (
                      <Badge size="2xsmall" color="purple">
                        {new Date(email.clicked_at).toLocaleString()}
                      </Badge>
                    ) : (
                      "-"
                    )}
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
  label: "Emails",
  icon: EnvelopeOpen,
})

export default EmailsPage
