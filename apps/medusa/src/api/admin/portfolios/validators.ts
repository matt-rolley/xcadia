import { z } from "zod"

export const PostAdminCreatePortfolio = z.object({
  team_id: z.string(),
  contact_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  slug: z.string(),
  password: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const PatchAdminUpdatePortfolio = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  password: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})
