import { Container, Heading, Button, Label, Input, Textarea, Badge, Table } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Trash, PencilSquare } from "@medusajs/icons"

type Company = {
  id: string
  name: string
  domain?: string
  industry?: string
  size?: string
  description?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  linkedin_url?: string
  twitter_handle?: string
  created_at: string
  updated_at: string
}

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  job_title?: string
}

type Deal = {
  id: string
  title: string
  value: number
  stage: string
  probability: number
}

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({})

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(`/admin/companies/${id}`, {
          credentials: "include",
        })
        const data = await response.json()
        setCompany(data.company)
        setFormData(data.company)
        setContacts(data.company.contacts || [])
        setDeals(data.company.deals || [])
      } catch (error) {
        console.error("Failed to fetch company:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/admin/companies/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      setCompany(data.company)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update company:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company?")) return

    try {
      await fetch(`/admin/companies/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      navigate("/app/companies")
    } catch (error) {
      console.error("Failed to delete company:", error)
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading company...</p>
        </div>
      </Container>
    )
  }

  if (!company) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Company not found</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">{company.name}</Heading>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <PencilSquare />
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Company Details */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Company Information</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            {editing ? (
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.name}</p>
            )}
          </div>
          <div>
            <Label>Domain</Label>
            {editing ? (
              <Input
                value={formData.domain || ""}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.domain || "-"}</p>
            )}
          </div>
          <div>
            <Label>Industry</Label>
            {editing ? (
              <Input
                value={formData.industry || ""}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.industry || "-"}</p>
            )}
          </div>
          <div>
            <Label>Size</Label>
            {editing ? (
              <Input
                value={formData.size || ""}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.size || "-"}</p>
            )}
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            {editing ? (
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.description || "-"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Contact Information</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Phone</Label>
            {editing ? (
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.phone || "-"}</p>
            )}
          </div>
          <div>
            <Label>Address</Label>
            {editing ? (
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.address || "-"}</p>
            )}
          </div>
          <div>
            <Label>City</Label>
            {editing ? (
              <Input
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.city || "-"}</p>
            )}
          </div>
          <div>
            <Label>State</Label>
            {editing ? (
              <Input
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            ) : (
              <p className="text-sm">{company.state || "-"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Contacts ({contacts.length})</Heading>
          <Link to="/contacts/new">
            <Button variant="secondary" size="small">Add Contact</Button>
          </Link>
        </div>
        {contacts.length === 0 ? (
          <p className="text-ui-fg-subtle text-sm">No contacts found</p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Job Title</Table.HeaderCell>
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
                  <Table.Cell>{contact.job_title || "-"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Deals */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Deals ({deals.length})</Heading>
          <Link to="/deals/new">
            <Button variant="secondary" size="small">Add Deal</Button>
          </Link>
        </div>
        {deals.length === 0 ? (
          <p className="text-ui-fg-subtle text-sm">No deals found</p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Value</Table.HeaderCell>
                <Table.HeaderCell>Stage</Table.HeaderCell>
                <Table.HeaderCell>Probability</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {deals.map((deal) => (
                <Table.Row key={deal.id}>
                  <Table.Cell>
                    <Link
                      to={`/deals/${deal.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {deal.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>${deal.value.toLocaleString()}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{deal.stage}</Badge>
                  </Table.Cell>
                  <Table.Cell>{deal.probability}%</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export default CompanyDetailPage

export const handle = {
  breadcrumb: () => "Company Details",
}
