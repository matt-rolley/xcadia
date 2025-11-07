import { model } from "@medusajs/framework/utils"

const DealLineItem = model.define("deal_line_item", {
  id: model.id().primaryKey(),
  scenario_id: model.text(), // Foreign key to DealScenario

  name: model.text(), // e.g., "Web Design", "Content Creation", "SEO Optimization"
  description: model.text().nullable(),

  quantity: model.number().default(1),
  unit_price: model.bigNumber(), // Price per unit
  total_price: model.bigNumber(), // Calculated: quantity * unit_price

  // Optional: Link to templates for common line items
  template_id: model.text().nullable(), // Foreign key to DealLineItemTemplate (future)

  // Metadata for custom fields
  metadata: model.json().nullable(),
})

export default DealLineItem
