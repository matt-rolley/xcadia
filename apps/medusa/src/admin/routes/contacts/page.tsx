import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  job_title?: string
  company?: {
    id: string
    name: string
  }
  lifecycle_stage?: string
  lead_score?: number
  created_at: string
}

const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch("/admin/contacts", {
          credentials: "include",
        })
        const data = await response.json()
        setContacts(data.contacts || [])
      } catch (error) {
        console.error("Failed to fetch contacts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Contacts</Heading>
        <Link to="/contacts/new">
          <Button variant="secondary">Add Contact</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No contacts found</p>
            <Link to="/contacts/new">
              <Button variant="secondary">Create your first contact</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Phone</Table.HeaderCell>
                <Table.HeaderCell>Job Title</Table.HeaderCell>
                <Table.HeaderCell>Company</Table.HeaderCell>
                <Table.HeaderCell>Stage</Table.HeaderCell>
                <Table.HeaderCell>Score</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {contacts.map((contact) => (
                <Table.Row key={contact.id}>
                  <Table.Cell>
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {contact.first_name} {contact.last_name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{contact.email}</Table.Cell>
                  <Table.Cell>{contact.phone || "-"}</Table.Cell>
                  <Table.Cell>{contact.job_title || "-"}</Table.Cell>
                  <Table.Cell>
                    {contact.company ? (
                      <Link
                        to={`/companies/${contact.company.id}`}
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                      >
                        {contact.company.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {contact.lifecycle_stage ? (
                      <Badge size="small">{contact.lifecycle_stage}</Badge>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell>{contact.lead_score || 0}</Table.Cell>
                  <Table.Cell>
                    {new Date(contact.created_at).toLocaleDateString()}
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
  label: "Contacts",
  icon: Users,
})

export default ContactsPage
