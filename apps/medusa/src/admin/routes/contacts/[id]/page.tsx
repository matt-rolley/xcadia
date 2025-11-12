import { Container, Heading, Button, Label, Input, Textarea, Badge, Table, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Trash, PencilSquare } from "@medusajs/icons"

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  mobile_phone?: string
  job_title?: string
  department?: string
  linkedin_url?: string
  twitter_handle?: string
  lifecycle_stage?: string
  lead_source?: string
  lead_score?: number
  notes?: string
  company_id?: string
  company?: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
}

type Activity = {
  id: string
  type: string
  description: string
  created_at: string
}

type Deal = {
  id: string
  title: string
  value: number
  stage: string
}

const ContactDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Contact>>({})

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch(`/admin/contacts/${id}`, {
          credentials: "include",
        })
        const data = await response.json()
        setContact(data.contact)
        setFormData(data.contact)
        setActivities(data.contact.activities || [])
        setDeals(data.contact.deals || [])
      } catch (error) {
        console.error("Failed to fetch contact:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContact()
  }, [id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/admin/contacts/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      setContact(data.contact)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update contact:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    try {
      await fetch(`/admin/contacts/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      navigate("/app/contacts")
    } catch (error) {
      console.error("Failed to delete contact:", error)
    }
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading contact...</p>
        </div>
      </Container>
    )
  }

  if (!contact) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Contact not found</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">
            {contact.first_name} {contact.last_name}
          </Heading>
          {contact.company && (
            <p className="text-sm text-ui-fg-subtle mt-1">
              <Link
                to={`/app/companies/${contact.company.id}`}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              >
                {contact.company.name}
              </Link>
            </p>
          )}
        </div>
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

      {/* Contact Details */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Contact Information</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>First Name</Label>
            {editing ? (
              <Input
                value={formData.first_name || ""}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.first_name}</p>
            )}
          </div>
          <div>
            <Label>Last Name</Label>
            {editing ? (
              <Input
                value={formData.last_name || ""}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.last_name}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            {editing ? (
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.email}</p>
            )}
          </div>
          <div>
            <Label>Phone</Label>
            {editing ? (
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.phone || "-"}</p>
            )}
          </div>
          <div>
            <Label>Job Title</Label>
            {editing ? (
              <Input
                value={formData.job_title || ""}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.job_title || "-"}</p>
            )}
          </div>
          <div>
            <Label>Department</Label>
            {editing ? (
              <Input
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.department || "-"}</p>
            )}
          </div>
          <div>
            <Label>Lifecycle Stage</Label>
            {editing ? (
              <Select
                value={formData.lifecycle_stage || ""}
                onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value })}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select stage" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="lead">Lead</Select.Item>
                  <Select.Item value="mql">MQL</Select.Item>
                  <Select.Item value="sql">SQL</Select.Item>
                  <Select.Item value="opportunity">Opportunity</Select.Item>
                  <Select.Item value="customer">Customer</Select.Item>
                </Select.Content>
              </Select>
            ) : (
              <Badge size="small">{contact.lifecycle_stage || "-"}</Badge>
            )}
          </div>
          <div>
            <Label>Lead Score</Label>
            {editing ? (
              <Input
                type="number"
                value={formData.lead_score || 0}
                onChange={(e) => setFormData({ ...formData, lead_score: parseInt(e.target.value) })}
              />
            ) : (
              <p className="text-sm">{contact.lead_score || 0}</p>
            )}
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            {editing ? (
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            ) : (
              <p className="text-sm">{contact.notes || "-"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Deals */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Deals ({deals.length})</Heading>
          <Link to="/app/deals/new">
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
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {deals.map((deal) => (
                <Table.Row key={deal.id}>
                  <Table.Cell>
                    <Link
                      to={`/app/deals/${deal.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {deal.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>${deal.value.toLocaleString()}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{deal.stage}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Recent Activity */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Recent Activity</Heading>
        {activities.length === 0 ? (
          <p className="text-ui-fg-subtle text-sm">No activities found</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-3 border-b border-ui-border-base last:border-0">
                <div className="flex-1">
                  <Badge size="small">{activity.type}</Badge>
                  <p className="text-sm mt-1">{activity.description}</p>
                  <p className="text-xs text-ui-fg-subtle mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export default ContactDetailPage

export const handle = {
  breadcrumb: () => "Contact Details",
}
