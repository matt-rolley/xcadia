import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import crypto from "crypto"

const createDomainSchema = z.object({
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid domain format"),
  from_name: z.string().min(1),
  from_email: z.string().email(),
})

/**
 * Generate DKIM key pair and record
 */
function generateDKIMRecord(domain: string): string {
  // In production, this would generate actual RSA keys
  // For now, return a placeholder
  const selector = "xcadia"
  const record = `v=DKIM1; k=rsa; p=${crypto.randomBytes(32).toString("base64")}`
  return record
}

/**
 * GET /admin/email-domains
 * List all email domains for team
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    const domains = await emailDomainModuleService.listEmailDomains({
      filters: { team_id },
      order: { is_default: "DESC", created_at: "DESC" },
    })

    return res.json({
      domains,
      count: domains.length,
    })
  } catch (error: any) {
    console.error("List email domains error:", error)
    return res.status(500).json({
      message: "Failed to list email domains",
      error: error.message,
    })
  }
}

/**
 * POST /admin/email-domains
 * Add a new email domain for team
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    // Validate request body
    const parsed = createDomainSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsed.error.errors,
      })
    }

    const { domain, from_name, from_email } = parsed.data

    // Validate that from_email matches domain
    const emailDomain = from_email.split("@")[1]
    if (emailDomain !== domain) {
      return res.status(400).json({
        message: `Email address must be on domain ${domain}`,
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    // Check if domain already exists
    const existingDomains = await emailDomainModuleService.listEmailDomains({
      filters: { domain },
      take: 1,
    })

    if (existingDomains && existingDomains.length > 0) {
      return res.status(400).json({
        message: "Domain already registered",
      })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    // Generate DKIM record
    const dkimValue = generateDKIMRecord(domain)

    // Create email domain
    const emailDomain = await emailDomainModuleService.createEmailDomains({
      team_id,
      domain,
      from_name,
      from_email,
      verification_token: verificationToken,
      dns_records: {
        spf: {
          type: "TXT",
          name: "@",
          value: "v=spf1 include:_spf.xcadia.com ~all",
          verified: false,
        },
        dkim: {
          type: "TXT",
          name: "xcadia._domainkey",
          value: dkimValue,
          verified: false,
        },
        dmarc: {
          type: "TXT",
          name: "_dmarc",
          value: "v=DMARC1; p=none; rua=mailto:dmarc@xcadia.com",
          verified: false,
        },
        verification: {
          type: "TXT",
          name: "_xcadia-verification",
          value: verificationToken,
          verified: false,
        },
      },
      verified: false,
      enabled: false,
      is_default: false,
    })

    return res.status(201).json({
      message: "Email domain created. Please add DNS records to verify.",
      domain: emailDomain,
      dns_instructions: {
        spf: {
          type: "TXT",
          name: "@",
          value: emailDomain.dns_records.spf.value,
          purpose: "Authorize Xcadia to send emails on your behalf",
        },
        dkim: {
          type: "TXT",
          name: "xcadia._domainkey",
          value: emailDomain.dns_records.dkim.value,
          purpose: "Email authentication and signing",
        },
        dmarc: {
          type: "TXT",
          name: "_dmarc",
          value: emailDomain.dns_records.dmarc.value,
          purpose: "Email authentication policy",
        },
        verification: {
          type: "TXT",
          name: "_xcadia-verification",
          value: verificationToken,
          purpose: "Verify domain ownership",
        },
      },
    })
  } catch (error: any) {
    console.error("Create email domain error:", error)
    return res.status(500).json({
      message: "Failed to create email domain",
      error: error.message,
    })
  }
}
