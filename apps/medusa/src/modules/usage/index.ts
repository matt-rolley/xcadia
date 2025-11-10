import { Module } from "@medusajs/framework/utils"
import UsageModuleService from "./service"

export const USAGE_MODULE = "usageModuleService"

export default Module(USAGE_MODULE, {
  service: UsageModuleService,
})
