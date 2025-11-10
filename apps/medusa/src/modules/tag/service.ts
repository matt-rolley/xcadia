import { MedusaService } from "@medusajs/framework/utils"
import Tag from "./models/tag"

class TagModuleService extends MedusaService({
  Tag,
}) {}

export default TagModuleService
