import { z } from "zod"

export const PostAdminCreateTeam = z.object({
  name: z.string(),
  description: z.string().optional(),
})

export const PatchAdminUpdateTeam = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
})

export const PostAdminCreateTeamMember = z.object({
  user_id: z.string(),
  role: z.enum(["owner", "admin", "member"]),
})

export const PatchAdminUpdateTeamMember = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
})
