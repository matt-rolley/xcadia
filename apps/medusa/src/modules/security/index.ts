import { Module } from "@medusajs/framework/utils"
import SecurityModuleService from "./service"

export const SECURITY_MODULE = "securityModuleService"

export default Module(SECURITY_MODULE, {
  service: SecurityModuleService,
})
