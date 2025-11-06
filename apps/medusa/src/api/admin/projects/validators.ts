import { z } from "zod"

export const PostAdminCreateProject = z.object({
  team_id: z.string(),
  company_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.any().optional(), // JSON field, can be any shape
  is_featured: z.boolean().optional(),
  display_order: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const PatchAdminUpdateProject = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.any().optional(), // JSON field, can be any shape
  is_featured: z.boolean().optional(),
  display_order: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})
