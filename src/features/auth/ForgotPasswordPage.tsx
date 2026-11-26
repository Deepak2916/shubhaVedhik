import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { SetupRequired } from '@/components/SetupRequired'
import { env } from '@/lib/env'
import { friendlyError } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import { AuthCard } from './AuthCard'
import { forgotSchema } from './schemas'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) })
  if (!env.isConfigured) return <SetupRequired />
  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${env.siteUrl}/reset-password` })
    if (error) return setError(friendlyError(error))
    setSent(true)
  })
  return (
    <AuthCard title="Reset your password" subtitle={sent ? 'If an account exists for that email, a reset link is on its way.' : 'We’ll email you a link to choose a new password.'} footer={<Link to="/login" className="text-kumkum hover:underline">Back to sign in</Link>}>
      {!sent && (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Email" error={formState.errors.email?.message}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.email)} type="email" autoComplete="email" {...register('email')} />}
          </Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
