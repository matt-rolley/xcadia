import { model } from "@medusajs/framework/utils"

/**
 * Email Domain Model
 * Manages custom email domains for teams (e.g., send emails from @yourcompany.com)
 */
const EmailDomain = model.define("email_domain", {
  id: model.id().primaryKey(),
  team_id: model.text(),

  // Domain details
  domain: model.text(), // e.g., "yourcompany.com"
  from_name: model.text().default(""), // Default sender name
  from_email: model.text(), // e.g., "hello@yourcompany.com"

  // Verification status
  verified: model.boolean().default(false),
  verification_token: model.text(),
  verified_at: model.dateTime().nullable(),

  // DNS records for verification (SPF, DKIM, DMARC)
  dns_records: model.json().default({
    spf: {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.xcadia.com ~all",
      verified: false,
    },
    dkim: {
      type: "TXT",
      name: "xcadia._domainkey",
      value: "", // Generated per domain
      verified: false,
    },
    dmarc: {
      type: "TXT",
      name: "_dmarc",
      value: "v=DMARC1; p=none; rua=mailto:dmarc@xcadia.com",
      verified: false,
    },
  }),

  // Status
  enabled: model.boolean().default(false),
  is_default: model.boolean().default(false), // Default domain for team

  // Stats
  emails_sent: model.number().default(0),
  last_sent_at: model.dateTime().nullable(),

  // Metadata
  metadata: model.json().nullable(),
})
.indexes([
  { on: ["team_id"], name: "idx_email_domain_team" },
  { on: ["domain"], name: "idx_email_domain_domain", unique: true },
  { on: ["verified"], name: "idx_email_domain_verified" },
  { on: ["team_id", "is_default"], name: "idx_email_domain_team_default" },
])

export default EmailDomain
