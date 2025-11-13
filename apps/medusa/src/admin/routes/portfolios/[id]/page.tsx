import { Container, Heading, Button, Label, Input, Textarea, Badge, Table, Switch } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Trash, PencilSquare, CloneDashed } from "@medusajs/icons"

type Portfolio = {
  id: string
  name: string
  slug: string
  description?: string
  is_public: boolean
  password_hash?: string
  expires_at?: string
  view_count: number
  projects: any[]
  created_at: string
}

const PortfolioDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Portfolio>>({})

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/admin/portfolios/${id}`, {
          credentials: "include",
        })
        const data = await response.json()
        setPortfolio(data.portfolio)
        setFormData(data.portfolio)
      } catch (error) {
        console.error("Failed to fetch portfolio:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [id])

  const handleSave = async () => {
    try {
      const response = await fetch(`/admin/portfolios/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      setPortfolio(data.portfolio)
      setEditing(false)
    } catch (error) {
      console.error("Failed to update portfolio:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return

    try {
      await fetch(`/admin/portfolios/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      navigate("/app/portfolios")
    } catch (error) {
      console.error("Failed to delete portfolio:", error)
    }
  }

  const getPublicUrl = () => {
    return `${window.location.origin}/p/${portfolio?.slug}`
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(getPublicUrl())
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading portfolio...</p>
        </div>
      </Container>
    )
  }

  if (!portfolio) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Portfolio not found</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{portfolio.name}</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">{portfolio.view_count || 0} views</p>
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

      <div className="px-6 py-4">
        <Heading level="h2" className="mb-4">Portfolio Settings</Heading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            {editing ? (
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{portfolio.name}</p>
            )}
          </div>
          <div>
            <Label>Slug (URL Path)</Label>
            {editing ? (
              <Input
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            ) : (
              <p className="text-sm font-mono">{portfolio.slug}</p>
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
              <p className="text-sm">{portfolio.description || "-"}</p>
            )}
          </div>
          <div>
            <Label>Public URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-ui-bg-subtle px-3 py-2 rounded flex-1">
                {getPublicUrl()}
              </code>
              <Button size="small" variant="secondary" onClick={copyUrl}>
                <CloneDashed />
              </Button>
            </div>
          </div>
          <div>
            <Label>Expires At</Label>
            {editing ? (
              <Input
                type="date"
                value={formData.expires_at?.split("T")[0] || ""}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            ) : (
              <p className="text-sm">
                {portfolio.expires_at
                  ? new Date(portfolio.expires_at).toLocaleDateString()
                  : "Never"}
              </p>
            )}
          </div>
          <div>
            <Label>Public Access</Label>
            <div className="flex items-center gap-2 mt-1">
              {editing ? (
                <Switch
                  checked={formData.is_public || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_public: checked })
                  }
                />
              ) : (
                <Badge color={portfolio.is_public ? "green" : "orange"}>
                  {portfolio.is_public ? "Public" : "Private"}
                </Badge>
              )}
            </div>
          </div>
          {editing && (
            <div>
              <Label>Password (optional)</Label>
              <Input
                type="password"
                placeholder="Leave empty to remove"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}
          {!editing && portfolio.password_hash && (
            <div>
              <Label>Password Protection</Label>
              <Badge size="small">Enabled</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Projects ({portfolio.projects?.length || 0})</Heading>
          <Link to="/projects/new">
            <Button variant="secondary" size="small">Add Project</Button>
          </Link>
        </div>
        {!portfolio.projects || portfolio.projects.length === 0 ? (
          <p className="text-ui-fg-subtle text-sm">No projects in this portfolio</p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Slug</Table.HeaderCell>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {portfolio.projects.map((project: any) => (
                <Table.Row key={project.id}>
                  <Table.Cell>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {project.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <code className="text-xs">{project.slug}</code>
                  </Table.Cell>
                  <Table.Cell>{project.portfolios?.display_order || 0}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={project.is_published ? "green" : "orange"}>
                      {project.is_published ? "Published" : "Draft"}
                    </Badge>
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

export default PortfolioDetailPage

export const handle = {
  breadcrumb: () => "Portfolio Details",
}
