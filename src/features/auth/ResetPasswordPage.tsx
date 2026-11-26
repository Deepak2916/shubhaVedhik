import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { friendlyError } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthProvider'
import { resetSchema } from './schemas'

export default function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })
  if (loading) return <PageLoader />
  if (!user)
    return <AuthCard title="Link expired" subtitle="Password reset links work once and expire after an hour. Request a new one from the sign-in page." />
  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setError(friendlyError(error))
    toast.success('Password updated')
    navigate('/dashboard', { replace: true })
  })
  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="New password" error={formState.errors.password?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        <Field label="Confirm password" error={formState.errors.confirm?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} type="password" autoComplete="new-password" {...register('confirm')} />}
        </Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  )
}
