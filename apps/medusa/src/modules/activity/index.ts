import ActivityModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const ACTIVITY_MODULE = "activityModuleService"

export default Module(ACTIVITY_MODULE, {
  service: ActivityModuleService,
})
