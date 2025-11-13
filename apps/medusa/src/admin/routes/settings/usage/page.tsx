import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"

type UsageData = {
  id: string
  period_start: string
  period_end: string
  storage_gb: number
  storage_limit_gb: number
  project_count: number
  project_limit: number
  email_count: number
  email_limit: number
  portfolio_view_count: number
  storage_warning_sent: boolean
  project_warning_sent: boolean
  email_warning_sent: boolean
  plan_name: string
  plan_price: number
  metadata?: Record<string, any>
}

const UsageDashboardPage = () => {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch("/admin/usage", {
          credentials: "include",
        })
        const data = await response.json()
        setUsage(data.usage)
      } catch (error) {
        console.error("Failed to fetch usage:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading usage data...</p>
        </div>
      </Container>
    )
  }

  if (!usage) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Failed to load usage data</p>
        </div>
      </Container>
    )
  }

  const storagePercent = (usage.storage_gb / usage.storage_limit_gb) * 100
  const projectPercent = (usage.project_count / usage.project_limit) * 100
  const emailPercent = (usage.email_count / usage.email_limit) * 100

  const getUsageColor = (percent: number): "red" | "orange" | "green" | "blue" | "grey" | "purple" => {
    if (percent >= 90) return "red"
    if (percent >= 75) return "orange"
    if (percent >= 50) return "green"
    return "blue"
  }

  const getProgressBarColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 75) return "bg-orange-500"
    if (percent >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getUsageStatus = (percent: number) => {
    if (percent >= 90) return "Critical"
    if (percent >= 75) return "Warning"
    if (percent >= 50) return "Moderate"
    return "Healthy"
  }

  const formatBytes = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    return `${(gb * 1024).toFixed(0)} MB`
  }

  const daysRemaining = Math.ceil(
    (new Date(usage.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Usage Dashboard</Heading>
            <p className="text-sm text-ui-fg-subtle mt-1">
              Monitor your workspace resource usage and limits
            </p>
          </div>
          <div className="text-right">
            <Badge size="large" color="blue">
              {usage.plan_name.toUpperCase()} PLAN
            </Badge>
            {usage.plan_price > 0 && (
              <p className="text-sm text-ui-fg-subtle mt-1">
                ${(usage.plan_price / 100).toFixed(2)}/month
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Billing Period */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ui-fg-subtle">Current Billing Period</p>
            <p className="font-medium">
              {new Date(usage.period_start).toLocaleDateString()} -{" "}
              {new Date(usage.period_end).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ui-fg-subtle">Days Remaining</p>
            <p className="text-2xl font-semibold">{daysRemaining}</p>
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Heading level="h2">Storage</Heading>
            <p className="text-sm text-ui-fg-subtle">
              File uploads and media storage
            </p>
          </div>
          <Badge size="small" color={getUsageColor(storagePercent)}>
            {getUsageStatus(storagePercent)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {formatBytes(usage.storage_gb)} of {formatBytes(usage.storage_limit_gb)}
            </span>
            <span className="font-semibold">{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-ui-bg-subtle rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBarColor(storagePercent)}`}
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
        </div>

        {usage.storage_warning_sent && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Warning email sent - approaching storage limit
            </p>
          </div>
        )}
      </div>

      {/* Projects Usage */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Heading level="h2">Projects</Heading>
            <p className="text-sm text-ui-fg-subtle">
              Active projects in your workspace
            </p>
          </div>
          <Badge size="small" color={getUsageColor(projectPercent)}>
            {getUsageStatus(projectPercent)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {usage.project_count} of {usage.project_limit} projects
            </span>
            <span className="font-semibold">{projectPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-ui-bg-subtle rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBarColor(projectPercent)}`}
              style={{ width: `${Math.min(projectPercent, 100)}%` }}
            />
          </div>
        </div>

        {usage.project_warning_sent && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Warning email sent - approaching project limit
            </p>
          </div>
        )}
      </div>

      {/* Email Usage */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Heading level="h2">Email Sends</Heading>
            <p className="text-sm text-ui-fg-subtle">
              Emails sent this billing period
            </p>
          </div>
          <Badge size="small" color={getUsageColor(emailPercent)}>
            {getUsageStatus(emailPercent)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {usage.email_count.toLocaleString()} of{" "}
              {usage.email_limit.toLocaleString()} emails
            </span>
            <span className="font-semibold">{emailPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-ui-bg-subtle rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBarColor(emailPercent)}`}
              style={{ width: `${Math.min(emailPercent, 100)}%` }}
            />
          </div>
        </div>

        {usage.email_warning_sent && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Warning email sent - approaching email limit
            </p>
          </div>
        )}
      </div>

      {/* Portfolio Views */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Heading level="h2">Portfolio Views</Heading>
            <p className="text-sm text-ui-fg-subtle">
              Total portfolio views this period
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-4xl font-bold text-blue-600">
            {usage.portfolio_view_count.toLocaleString()}
          </div>
          <div className="text-right">
            <p className="text-sm text-ui-fg-subtle">Total Views</p>
            <p className="text-xs text-ui-fg-muted">
              Avg: {Math.round(usage.portfolio_view_count / Math.max(1, 30 - daysRemaining))}/day
            </p>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <Heading level="h2" className="mb-4">
          Usage Summary
        </Heading>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-ui-border-base rounded-lg p-4 bg-white">
            <p className="text-sm text-ui-fg-subtle mb-1">Storage Used</p>
            <p className="text-xl font-semibold">{storagePercent.toFixed(0)}%</p>
            <p className="text-xs text-ui-fg-muted mt-1">
              {formatBytes(usage.storage_limit_gb - usage.storage_gb)} remaining
            </p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4 bg-white">
            <p className="text-sm text-ui-fg-subtle mb-1">Projects Used</p>
            <p className="text-xl font-semibold">{projectPercent.toFixed(0)}%</p>
            <p className="text-xs text-ui-fg-muted mt-1">
              {usage.project_limit - usage.project_count} projects remaining
            </p>
          </div>
          <div className="border border-ui-border-base rounded-lg p-4 bg-white">
            <p className="text-sm text-ui-fg-subtle mb-1">Emails Used</p>
            <p className="text-xl font-semibold">{emailPercent.toFixed(0)}%</p>
            <p className="text-xs text-ui-fg-muted mt-1">
              {(usage.email_limit - usage.email_count).toLocaleString()} emails remaining
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Notice */}
      {usage.plan_name === "free" && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h3">Need more resources?</Heading>
              <p className="text-sm text-ui-fg-subtle mt-1">
                Upgrade to a Pro plan for higher limits and additional features
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Usage",
})

export default UsageDashboardPage
