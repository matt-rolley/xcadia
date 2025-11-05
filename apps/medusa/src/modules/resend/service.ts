import {
  AbstractNotificationProviderService,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  Resend,
  CreateEmailOptions,
} from "resend"

type ResendOptions = {
  api_key: string
  from: string
  html_templates?: Record<string, {
    subject?: string
    content: string
  }>
}

type InjectedDependencies = {
  logger: Logger
}

// Email templates enum for type safety
enum Templates {
  TEAM_MEMBER_INVITED = "team-member-invited",
  TEAM_MEMBER_JOINED = "team-member-joined",
  CONTACT_CREATED = "contact-created",
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor(
    { logger }: InjectedDependencies,
    options: ResendOptions
  ) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates)

    if (!template) {
      this.logger.error(`Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates)}`)
      return {}
    }

    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
    }

    let emailOptions: CreateEmailOptions
    if (typeof template === "string") {
      emailOptions = {
        ...commonOptions,
        html: template,
      }
    } else {
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
      }
    }

    const { data, error } = await this.resendClient.emails.send(emailOptions)

    if (error || !data) {
      if (error) {
        this.logger.error("Failed to send email", error)
      } else {
        this.logger.error("Failed to send email: unknown error")
      }
      return {}
    }

    return { id: data.id }
  }

  private getTemplate(template: Templates): string | ((data: any) => string) | undefined {
    // Check if custom template is provided in options
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates[template].content
    }

    // Default templates
    switch (template) {
      case Templates.TEAM_MEMBER_INVITED:
        return (data: any) => `
          <h1>You've been invited to join a team!</h1>
          <p>You've been invited to join a team. Click the link below to accept:</p>
          <a href="${data.invite_url || '#'}">Accept Invitation</a>
        `
      case Templates.TEAM_MEMBER_JOINED:
        return (data: any) => `
          <h1>Welcome to the team!</h1>
          <p>You've successfully joined the team. You can now access the dashboard.</p>
        `
      case Templates.CONTACT_CREATED:
        return (data: any) => `
          <h1>New Contact Created</h1>
          <p>A new contact has been added: ${data.email}</p>
        `
      default:
        return undefined
    }
  }

  private getTemplateSubject(template: Templates): string {
    // Check if custom subject is provided
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject!
    }

    // Default subjects
    switch (template) {
      case Templates.TEAM_MEMBER_INVITED:
        return "You've been invited to join a team"
      case Templates.TEAM_MEMBER_JOINED:
        return "Welcome to the team!"
      case Templates.CONTACT_CREATED:
        return "New Contact Created"
      default:
        return "Notification from Xcadia"
    }
  }
}

export default ResendNotificationProviderService
