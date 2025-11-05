import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type SendNotificationStepInput = {
  to: string
  channel: string
  template: string
  data?: Record<string, any>
}

export const sendNotificationStep = createStep(
  "send-notification",
  async (input: SendNotificationStepInput, { container }) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    const notification = await notificationModuleService.createNotifications({
      to: input.to,
      channel: input.channel,
      template: input.template,
      data: input.data || {},
    })

    return new StepResponse(notification)
  }
  // No compensation needed - emails can't be "unsent"
)
