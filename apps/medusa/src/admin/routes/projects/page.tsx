import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Project = {
  id: string
  name: string
  slug: string
  description?: string
  is_published: boolean
  thumbnail_url?: string
  portfolio_count: number
  created_at: string
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/admin/projects", {
          credentials: "include",
        })
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Projects</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Manage your portfolio projects and case studies
          </p>
        </div>
        <Link to="/projects/new">
          <Button variant="secondary">Create Project</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No projects found</p>
            <Link to="/projects/new">
              <Button variant="secondary">Create your first project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <div className="border border-ui-border-base rounded-lg p-4 hover:border-ui-border-interactive cursor-pointer">
                  {project.thumbnail_url && (
                    <img
                      src={project.thumbnail_url}
                      alt={project.name}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <Heading level="h3">{project.name}</Heading>
                    <Badge size="small" color={project.is_published ? "green" : "orange"}>
                      {project.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-ui-fg-subtle mb-2">
                      {project.description.substring(0, 80)}
                      {project.description.length > 80 ? "..." : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-ui-fg-subtle">
                    <span>{project.portfolio_count} portfolios</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Projects",
  icon: SquaresPlus,
})

export default ProjectsPage
