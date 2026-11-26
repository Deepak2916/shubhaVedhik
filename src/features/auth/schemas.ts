import { z } from 'zod'

export const emailSchema = z.email('Enter a valid email address')
export const passwordSchema = z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters')

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password') })
export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(120),
  email: emailSchema,
  password: passwordSchema,
})
export const forgotSchema = z.object({ email: emailSchema })
export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Passwords don’t match', path: ['confirm'] })
