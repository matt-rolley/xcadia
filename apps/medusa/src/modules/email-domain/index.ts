import { Module } from "@medusajs/framework/utils"
import EmailDomainModuleService from "./service"

export const EMAIL_DOMAIN_MODULE = "emailDomainModuleService"

export default Module(EMAIL_DOMAIN_MODULE, {
  service: EmailDomainModuleService,
})
