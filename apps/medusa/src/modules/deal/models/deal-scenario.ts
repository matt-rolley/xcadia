import { model } from "@medusajs/framework/utils"

const DealScenario = model.define("deal_scenario", {
  id: model.id().primaryKey(),
  deal_id: model.text(), // Foreign key to Deal

  name: model.text(), // e.g., "Option A - Full Package", "Option B - Basic"
  description: model.text().nullable(),

  is_active: model.boolean().default(true),
  is_selected: model.boolean().default(false), // Which option client selected

  // Auto-calculated from line items (computed in workflows)
  subtotal: model.bigNumber().default(0), // Sum of all line items
  tax_rate: model.number().default(0), // Percentage (e.g., 10 for 10%)
  tax_amount: model.bigNumber().default(0), // Calculated: subtotal * tax_rate / 100
  discount_amount: model.bigNumber().default(0), // Fixed discount amount
  discount_percentage: model.number().default(0), // Percentage discount
  total: model.bigNumber().default(0), // Final total after tax and discounts

  // Metadata for custom fields
  metadata: model.json().nullable(),
})

export default DealScenario
