import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { SetupRequired } from '@/components/SetupRequired'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { env } from '@/lib/env'
import { friendlyError } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthProvider'
import { registerSchema } from './schemas'

export default function RegisterPage() {
  useDocumentMeta({ title: 'Create your account · ShubhaVedhik' })
  const [params] = useSearchParams()
  const template = params.get('template')
  const next = template ? `/dashboard?new=1&template=${encodeURIComponent(template)}` : '/dashboard?new=1'
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) })
  if (!env.isConfigured) return <SetupRequired />
  if (user) return <Navigate to={next} replace />

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: { data: { full_name: v.fullName } },
    })
    if (error) return setError(friendlyError(error))

    if (data.session) {
      navigate(next, { replace: true })
      return
    }

    // Fallback: if confirmation is still enabled server-side, no session is returned.
    // Sign in explicitly (this will fail with "Email not confirmed" if the setting is still on).
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: v.email,
      password: v.password,
    })
    if (signInError) return setError(friendlyError(signInError))
    navigate(next, { replace: true })
  })

  return (
    <AuthCard
      title="Create your invitation"
      subtitle={template ? 'You’ll start with the design you picked — change it any time.' : 'Free to design. Publish when your family approves.'}
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-kumkum hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Your name" error={formState.errors.fullName?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.fullName)} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.email)} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label="Password" error={formState.errors.password?.message} hint="At least 8 characters.">
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.password)} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Create account
        </Button>
        <p className="text-xs text-mist">
          By continuing you agree to our <Link to="/terms" className="underline">terms</Link> and <Link to="/privacy" className="underline">privacy policy</Link>.
        </p>
      </form>
    </AuthCard>
  )
}