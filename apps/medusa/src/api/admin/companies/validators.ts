import { z } from "zod"

export const PostAdminCreateCompany = z.object({
  team_id: z.string(),
  name: z.string(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
})

export const PatchAdminUpdateCompany = z.object({
  name: z.string().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
})

export const PostAdminCreateContact = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().optional(),
})

export const PatchAdminUpdateContact = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  is_primary: z.boolean().optional(),
})
