import { Module } from "@medusajs/framework/utils"
import TagModuleService from "./service"

export const TAG_MODULE = "tagModuleService"

export default Module(TAG_MODULE, {
  service: TagModuleService,
})
