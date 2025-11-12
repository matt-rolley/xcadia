import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Container, Heading, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

type Deal = {
  id: string
  title: string
  value: number
  stage: string
  probability: number
  expected_close_date?: string
  company?: {
    id: string
    name: string
  }
  contact?: {
    id: string
    first_name: string
    last_name: string
  }
}

const STAGES = [
  { value: "lead", label: "Lead", color: "bg-gray-100" },
  { value: "qualified", label: "Qualified", color: "bg-blue-100" },
  { value: "proposal", label: "Proposal", color: "bg-purple-100" },
  { value: "negotiation", label: "Negotiation", color: "bg-yellow-100" },
  { value: "won", label: "Won", color: "bg-green-100" },
  { value: "lost", label: "Lost", color: "bg-red-100" },
]

const DealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline")

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/admin/deals", {
          credentials: "include",
        })
        const data = await response.json()
        setDeals(data.deals || [])
      } catch (error) {
        console.error("Failed to fetch deals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage)
  }

  const getTotalValueByStage = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0)
  }

  const getTotalValue = () => {
    return deals.reduce((sum, deal) => sum + deal.value, 0)
  }

  const getWeightedValue = () => {
    return deals.reduce((sum, deal) => sum + (deal.value * deal.probability) / 100, 0)
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Deals</Heading>
          <div className="flex gap-4 mt-2">
            <p className="text-sm text-ui-fg-subtle">
              Total Value: <span className="font-semibold">${getTotalValue().toLocaleString()}</span>
            </p>
            <p className="text-sm text-ui-fg-subtle">
              Weighted Value: <span className="font-semibold">${getWeightedValue().toLocaleString()}</span>
            </p>
            <p className="text-sm text-ui-fg-subtle">
              Count: <span className="font-semibold">{deals.length}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "pipeline" ? "primary" : "secondary"}
            onClick={() => setViewMode("pipeline")}
            size="small"
          >
            Pipeline
          </Button>
          <Button
            variant={viewMode === "list" ? "primary" : "secondary"}
            onClick={() => setViewMode("list")}
            size="small"
          >
            List
          </Button>
          <Link to="/app/deals/new">
            <Button variant="secondary">Add Deal</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No deals found</p>
            <Link to="/app/deals/new">
              <Button variant="secondary">Create your first deal</Button>
            </Link>
          </div>
        ) : viewMode === "pipeline" ? (
          /* Pipeline View */
          <div className="grid grid-cols-6 gap-4">
            {STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage.value)
              const totalValue = getTotalValueByStage(stage.value)

              return (
                <div key={stage.value} className="flex flex-col">
                  <div className={`${stage.color} rounded-lg p-3 mb-3`}>
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                    <p className="text-xs text-ui-fg-subtle mt-1">
                      {stageDeals.length} deals • ${totalValue.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {stageDeals.map((deal) => (
                      <Link key={deal.id} to={`/app/deals/${deal.id}`}>
                        <div className="border border-ui-border-base rounded-lg p-3 hover:border-ui-border-interactive cursor-pointer bg-ui-bg-base">
                          <h4 className="font-medium text-sm mb-1">{deal.title}</h4>
                          <p className="text-sm font-semibold text-ui-fg-interactive mb-2">
                            ${deal.value.toLocaleString()}
                          </p>
                          {deal.company && (
                            <p className="text-xs text-ui-fg-subtle mb-1">
                              {deal.company.name}
                            </p>
                          )}
                          {deal.contact && (
                            <p className="text-xs text-ui-fg-subtle">
                              {deal.contact.first_name} {deal.contact.last_name}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <Badge size="2xsmall">{deal.probability}%</Badge>
                            {deal.expected_close_date && (
                              <p className="text-xs text-ui-fg-subtle">
                                {new Date(deal.expected_close_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {deals.map((deal) => (
              <Link key={deal.id} to={`/app/deals/${deal.id}`}>
                <div className="border border-ui-border-base rounded-lg p-4 hover:border-ui-border-interactive cursor-pointer flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{deal.title}</h4>
                    <div className="flex gap-4 text-sm text-ui-fg-subtle">
                      {deal.company && <span>{deal.company.name}</span>}
                      {deal.contact && (
                        <span>
                          {deal.contact.first_name} {deal.contact.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge>{deal.stage}</Badge>
                    <Badge size="small">{deal.probability}%</Badge>
                    <p className="font-semibold text-ui-fg-interactive">
                      ${deal.value.toLocaleString()}
                    </p>
                    {deal.expected_close_date && (
                      <p className="text-sm text-ui-fg-subtle">
                        {new Date(deal.expected_close_date).toLocaleDateString()}
                      </p>
                    )}
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
  label: "Deals",
  icon: CurrencyDollar,
})

export default DealsPage
