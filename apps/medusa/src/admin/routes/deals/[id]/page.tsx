import { Container, Heading, Button, Label, Input, Textarea, Badge, Table, Select } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Trash, PencilSquare } from "@medusajs/icons"

type Deal = {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  expected_close_date?: string
  actual_close_date?: string
  description?: string
  lost_reason?: string
  company_id?: string
  company?: {
    id: string
    name: string
  }
  contact_id?: string
  contact?: {
    id: string
    first_name: string
    last_name: string
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

const DealDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Deal>>({})

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`/admin/deals/${id}`, {
          credentials: "include",
        })
        const data = await response.json()
        setDeal(data.deal)
        setFormData(data.deal)
        setActivities(data.deal.activities || [])
      } catch (error) {
        console.error("Failed to fetch deal:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeal()
  }, [id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/admin/deals/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      setDeal(data.deal)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update deal:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deal?")) return

    try {
      await fetch(`/admin/deals/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      navigate("/app/deals")
    } catch (error) {
      console.error("Failed to delete deal:", error)
    }
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: "gray",
      qualified: "blue",
      proposal: "purple",
      negotiation: "yellow",
      won: "green",
      lost: "red",
    }
    return colors[stage] || "gray"
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading deal...</p>
        </div>
      </Container>
    )
  }

  if (!deal) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Deal not found</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Heading level="h1">{deal.title}</Heading>
            <Badge color={getStageColor(deal.stage)}>{deal.stage}</Badge>
          </div>
          <div className="flex gap-4 text-sm text-ui-fg-subtle">
            <span className="font-semibold text-ui-fg-interactive text-xl">
              ${deal.value.toLocaleString()}
            </span>
            <span>•</span>
            <span>{deal.probability}% probability</span>
            {deal.expected_close_date && (
              <>
                <span>•</span>
                <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
              </>
            )}
          </div>
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

      {/* Deal Details */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Deal Information</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            {editing ? (
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            ) : (
              <p className="text-sm">{deal.title}</p>
            )}
          </div>
          <div>
            <Label>Value</Label>
            {editing ? (
              <Input
                type="number"
                value={formData.value || 0}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              />
            ) : (
              <p className="text-sm">${deal.value.toLocaleString()}</p>
            )}
          </div>
          <div>
            <Label>Stage</Label>
            {editing ? (
              <Select
                value={formData.stage || ""}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select stage" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="lead">Lead</Select.Item>
                  <Select.Item value="qualified">Qualified</Select.Item>
                  <Select.Item value="proposal">Proposal</Select.Item>
                  <Select.Item value="negotiation">Negotiation</Select.Item>
                  <Select.Item value="won">Won</Select.Item>
                  <Select.Item value="lost">Lost</Select.Item>
                </Select.Content>
              </Select>
            ) : (
              <Badge color={getStageColor(deal.stage)}>{deal.stage}</Badge>
            )}
          </div>
          <div>
            <Label>Probability</Label>
            {editing ? (
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.probability || 0}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
              />
            ) : (
              <p className="text-sm">{deal.probability}%</p>
            )}
          </div>
          <div>
            <Label>Expected Close Date</Label>
            {editing ? (
              <Input
                type="date"
                value={formData.expected_close_date?.split("T")[0] || ""}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            ) : (
              <p className="text-sm">
                {deal.expected_close_date
                  ? new Date(deal.expected_close_date).toLocaleDateString()
                  : "-"}
              </p>
            )}
          </div>
          <div>
            <Label>Actual Close Date</Label>
            <p className="text-sm">
              {deal.actual_close_date
                ? new Date(deal.actual_close_date).toLocaleDateString()
                : "-"}
            </p>
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            {editing ? (
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            ) : (
              <p className="text-sm">{deal.description || "-"}</p>
            )}
          </div>
          {deal.stage === "lost" && deal.lost_reason && (
            <div className="col-span-2">
              <Label>Lost Reason</Label>
              <p className="text-sm">{deal.lost_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Associated Records */}
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Associated Records</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Company</Label>
            {deal.company ? (
              <Link
                to={`/app/companies/${deal.company.id}`}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm"
              >
                {deal.company.name}
              </Link>
            ) : (
              <p className="text-sm text-ui-fg-subtle">No company</p>
            )}
          </div>
          <div>
            <Label>Contact</Label>
            {deal.contact ? (
              <Link
                to={`/app/contacts/${deal.contact.id}`}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm"
              >
                {deal.contact.first_name} {deal.contact.last_name}
              </Link>
            ) : (
              <p className="text-sm text-ui-fg-subtle">No contact</p>
            )}
          </div>
        </div>
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

export default DealDetailPage

export const handle = {
  breadcrumb: () => "Deal Details",
}
