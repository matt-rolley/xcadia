import { model } from "@medusajs/framework/utils"

const Consent = model.define("consent", {
  id: model.id().primaryKey(),
  contact_id: model.text(), // Foreign key to Contact (for GDPR consent tracking)

  consent_type: model.enum([
    "email_tracking", // Open/click tracking pixels
    "analytics", // Portfolio view analytics
    "marketing", // Marketing communications
    "data_processing", // General data processing consent
  ]),

  given: model.boolean().default(false), // Whether consent is given or withdrawn

  // Proof of consent (GDPR requirement)
  ip_address: model.text().nullable(),
  user_agent: model.text().nullable(),
  consent_method: model.text().nullable(), // "checkbox", "email_link", "api"

  // Timestamps
  given_at: model.dateTime().nullable(), // When consent was given
  withdrawn_at: model.dateTime().nullable(), // When consent was withdrawn
})
.indexes([
  { on: ["contact_id"], name: "idx_consent_contact" },
  { on: ["consent_type"], name: "idx_consent_type" },
  { on: ["contact_id", "consent_type"], name: "idx_consent_contact_type", unique: true }, // One consent record per type per contact
])

export default Consent
