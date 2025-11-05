import PortfolioModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PORTFOLIO_MODULE = "portfolioModuleService"

export default Module(PORTFOLIO_MODULE, {
  service: PortfolioModuleService,
})
