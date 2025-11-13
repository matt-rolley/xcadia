import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Label, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Trash } from "@medusajs/icons"

type Tag = {
  id: string
  name: string
  color?: string
  usage_count: number
  created_at: string
}

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", color: "#3b82f6" })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch("/admin/tags", {
        credentials: "include",
      })
      const data = await response.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error("Failed to fetch tags:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await fetch("/admin/tags", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      setShowForm(false)
      setFormData({ name: "", color: "#3b82f6" })
      fetchTags()
    } catch (error) {
      console.error("Failed to create tag:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return

    try {
      await fetch(`/admin/tags/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchTags()
    } catch (error) {
      console.error("Failed to delete tag:", error)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Tags</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Organize contacts, companies, and deals with tags
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Tag"}
        </Button>
      </div>

      {showForm && (
        <div className="px-6 py-4 bg-ui-bg-subtle">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tag Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleCreate}>
            Create Tag
          </Button>
        </div>
      )}

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No tags created yet</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Tag</Table.HeaderCell>
                <Table.HeaderCell>Usage</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tags.map((tag) => (
                <Table.Row key={tag.id}>
                  <Table.Cell>
                    <Badge
                      size="small"
                      style={{
                        backgroundColor: tag.color,
                        color: "#fff",
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{tag.usage_count || 0} items</Table.Cell>
                  <Table.Cell>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash />
                    </Button>
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
  label: "Tags",
})

export default TagsPage
