import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type InitializeUsageInput = {
  team_id: string
  plan_name?: string // "free", "pro_monthly", "pro_yearly"
}

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    storage_limit_gb: 5,
    project_limit: 10,
    email_limit: 100,
    price: 0,
  },
  pro_monthly: {
    storage_limit_gb: 100,
    project_limit: 100,
    email_limit: 5000,
    price: 4900, // $49/month in cents
  },
  pro_yearly: {
    storage_limit_gb: 100,
    project_limit: 100,
    email_limit: 5000,
    price: 47040, // $490/year in cents ($49 * 12 * 0.8 = 20% discount)
  },
}

// Step: Create usage tracker for team
const createUsageTrackerStep = createStep(
  "create-usage-tracker",
  async (
    { team_id, plan_name = "free" }: InitializeUsageInput,
    { container }
  ) => {
    const usageModuleService = container.resolve("usageModuleService")

    // Get plan limits
    const planLimits = PLAN_LIMITS[plan_name] || PLAN_LIMITS.free

    // Calculate billing period (current month)
    const now = new Date()
    const period_start = new Date(now.getFullYear(), now.getMonth(), 1)
    const period_end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Check if tracker already exists for this period
    const existing = await usageModuleService.listUsageTrackers({
      filters: {
        team_id,
        period_end: { $gte: now },
      },
      take: 1,
    })

    if (existing && existing.length > 0) {
      console.log(`Usage tracker already exists for team ${team_id}`)
      return new StepResponse({ usageTracker: existing[0] })
    }

    // Create new usage tracker
    const usageTracker = await usageModuleService.createUsageTrackers({
      team_id,
      period_start,
      period_end,
      storage_gb: 0,
      storage_limit_gb: planLimits.storage_limit_gb,
      project_count: 0,
      project_limit: planLimits.project_limit,
      email_count: 0,
      email_limit: planLimits.email_limit,
      portfolio_view_count: 0,
      storage_warning_sent: false,
      project_warning_sent: false,
      email_warning_sent: false,
      plan_name,
      plan_price: planLimits.price,
    })

    console.log(`Created usage tracker for team ${team_id} with ${plan_name} plan`)

    return new StepResponse(
      { usageTracker },
      async () => {
        // Rollback: delete the usage tracker if something fails
        await usageModuleService.deleteUsageTrackers(usageTracker.id)
      }
    )
  }
)

export const initializeUsageTrackerWorkflow = createWorkflow(
  "initialize-usage-tracker",
  function (input: InitializeUsageInput): WorkflowResponse<{ usageTracker: any }> {
    const { usageTracker } = createUsageTrackerStep(input)

    return new WorkflowResponse({ usageTracker })
  }
)
