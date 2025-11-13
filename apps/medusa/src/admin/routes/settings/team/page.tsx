import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Label, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Trash } from "@medusajs/icons"

type TeamMember = {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  last_login_at?: string
  created_at: string
}

const TeamPage = () => {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: "", name: "", role: "member" })

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const response = await fetch("/admin/team/members", {
        credentials: "include",
      })
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error("Failed to fetch team:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      await fetch("/admin/team/invite", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      setShowForm(false)
      setFormData({ email: "", name: "", role: "member" })
      fetchTeam()
    } catch (error) {
      console.error("Failed to invite member:", error)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return

    try {
      await fetch(`/admin/team/members/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchTeam()
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Team Members</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Manage team access and permissions
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Invite Member"}
        </Button>
      </div>

      {showForm && (
        <div className="px-6 py-4 bg-ui-bg-subtle">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleInvite}>
            Send Invitation
          </Button>
        </div>
      )}

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading team members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No team members yet</p>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Role</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Last Login</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {members.map((member) => (
                <Table.Row key={member.id}>
                  <Table.Cell>{member.name}</Table.Cell>
                  <Table.Cell>{member.email}</Table.Cell>
                  <Table.Cell>
                    <Badge size="small">{member.role}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="small" color={member.is_active ? "green" : "red"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {member.last_login_at
                      ? new Date(member.last_login_at).toLocaleString()
                      : "Never"}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleRemove(member.id)}
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
  label: "Team",
})

export default TeamPage
