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
import { loginSchema } from './schemas'

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null, fallback = '/dashboard'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export default function LoginPage() {
  useDocumentMeta({ title: 'Sign in · ShubhaVedhik' })
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) })
  if (!env.isConfigured) return <SetupRequired />
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(v)
    if (error) return setError(friendlyError(error))
    navigate(safeNext(params.get('next')), { replace: true })
  })

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage your invitations."
      footer={
        <>
          New here?{' '}
          <Link to={`/register${params.toString() ? `?${params}` : ''}`} className="font-medium text-kumkum hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email" error={formState.errors.email?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.email)} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label="Password" error={formState.errors.password?.message} hint={<Link to="/forgot-password" className="text-kumkum hover:underline">Forgot your password?</Link>}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(formState.errors.password)} type="password" autoComplete="current-password" {...register('password')} />}
        </Field>
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  )
}
