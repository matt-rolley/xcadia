import TeamModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const TEAM_MODULE = "teamModuleService"

export default Module(TEAM_MODULE, {
  service: TeamModuleService,
})
