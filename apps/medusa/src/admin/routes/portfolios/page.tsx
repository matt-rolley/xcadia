import { defineRouteConfig } from "@medusajs/admin-sdk"
import { FolderOpen } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge, Copy } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Portfolio = {
  id: string
  name: string
  slug: string
  description?: string
  is_public: boolean
  password_hash?: string
  expires_at?: string
  project_count: number
  view_count: number
  created_at: string
}

const PortfoliosPage = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await fetch("/admin/portfolios", {
          credentials: "include",
        })
        const data = await response.json()
        setPortfolios(data.portfolios || [])
      } catch (error) {
        console.error("Failed to fetch portfolios:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolios()
  }, [])

  const getPublicUrl = (slug: string) => {
    return `${window.location.origin}/p/${slug}`
  }

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getPublicUrl(slug))
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Portfolios</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Create shareable portfolio collections with password protection
          </p>
        </div>
        <Link to="/app/portfolios/new">
          <Button variant="secondary">Create Portfolio</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading portfolios...</p>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No portfolios found</p>
            <Link to="/app/portfolios/new">
              <Button variant="secondary">Create your first portfolio</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Public URL</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Projects</Table.HeaderCell>
                <Table.HeaderCell>Views</Table.HeaderCell>
                <Table.HeaderCell>Expires</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {portfolios.map((portfolio) => (
                <Table.Row key={portfolio.id}>
                  <Table.Cell>
                    <Link
                      to={`/app/portfolios/${portfolio.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {portfolio.name}
                    </Link>
                    {portfolio.description && (
                      <p className="text-xs text-ui-fg-subtle mt-1">
                        {portfolio.description.substring(0, 50)}
                        {portfolio.description.length > 50 ? "..." : ""}
                      </p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-ui-bg-subtle px-2 py-1 rounded">
                        /p/{portfolio.slug}
                      </code>
                      <Button
                        size="small"
                        variant="transparent"
                        onClick={() => copyUrl(portfolio.slug)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <Badge size="small" color={portfolio.is_public ? "green" : "orange"}>
                        {portfolio.is_public ? "Public" : "Private"}
                      </Badge>
                      {portfolio.password_hash && (
                        <Badge size="2xsmall">Password Protected</Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{portfolio.project_count || 0}</Table.Cell>
                  <Table.Cell>{portfolio.view_count || 0}</Table.Cell>
                  <Table.Cell>
                    {portfolio.expires_at ? (
                      <span
                        className={
                          new Date(portfolio.expires_at) < new Date()
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {new Date(portfolio.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      "Never"
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(portfolio.created_at).toLocaleDateString()}
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
  label: "Portfolios",
  icon: FolderOpen,
})

export default PortfoliosPage
