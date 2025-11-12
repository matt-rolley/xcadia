import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Building } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Company = {
  id: string
  name: string
  domain?: string
  industry?: string
  size?: string
  contact_count: number
  deal_count: number
  created_at: string
}

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/admin/companies", {
          credentials: "include",
        })
        const data = await response.json()
        setCompanies(data.companies || [])
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Companies</Heading>
        <Link to="/app/companies/new">
          <Button variant="secondary">Add Company</Button>
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No companies found</p>
            <Link to="/app/companies/new">
              <Button variant="secondary">Create your first company</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Domain</Table.HeaderCell>
                <Table.HeaderCell>Industry</Table.HeaderCell>
                <Table.HeaderCell>Size</Table.HeaderCell>
                <Table.HeaderCell>Contacts</Table.HeaderCell>
                <Table.HeaderCell>Deals</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {companies.map((company) => (
                <Table.Row key={company.id}>
                  <Table.Cell>
                    <Link
                      to={`/app/companies/${company.id}`}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {company.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{company.domain || "-"}</Table.Cell>
                  <Table.Cell>
                    {company.industry ? (
                      <Badge size="small">{company.industry}</Badge>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell>{company.size || "-"}</Table.Cell>
                  <Table.Cell>{company.contact_count || 0}</Table.Cell>
                  <Table.Cell>{company.deal_count || 0}</Table.Cell>
                  <Table.Cell>
                    {new Date(company.created_at).toLocaleDateString()}
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
  label: "Companies",
  icon: Building,
})

export default CompaniesPage
