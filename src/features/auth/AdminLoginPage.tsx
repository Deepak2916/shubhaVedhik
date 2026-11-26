import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Logo, PageLoader } from '@/components/ui/Primitives'
import { SetupRequired } from '@/components/SetupRequired'
import { useQueryClient } from '@tanstack/react-query'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { env } from '@/lib/env'
import { friendlyError } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'
import { loginSchema } from './schemas'

/** Separate entry point for administrators. Role is verified by the database (is_admin RPC). */
export default function AdminLoginPage() {
  useDocumentMeta({ title: 'Admin sign in · ShubhaVedhik', noindex: true })
  const [params] = useSearchParams()
  const { user, isAdmin, adminLoading, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(params.get('denied') ? 'That account doesn’t have admin access.' : null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) })
  if (!env.isConfigured) return <SetupRequired />
  if (loading || adminLoading) return <PageLoader />
  if (user && isAdmin) return <Navigate to="/admin" replace />

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(v)
    if (error) return setError(friendlyError(error))
    const { data } = await supabase.rpc('is_admin')
    if (data !== true) {
      await supabase.auth.signOut()
      return setError('That account doesn’t have admin access.')
    }
    await qc.invalidateQueries({ queryKey: ['is-admin'] })
    navigate('/admin', { replace: true })
  })

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-plum px-5">
      <div className="w-full max-w-sm rounded-[22px] bg-paper p-8 shadow-lift">
        <Logo />
        <div className="mt-8 flex items-center gap-2 text-kumkum">
          <ShieldCheck className="size-5" aria-hidden />
          <h1 className="font-display text-2xl text-plum">Admin console</h1>
        </div>
        {user && !isAdmin && (
          <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-sm">
            Signed in as {user.email}, which isn’t an admin.{' '}
            <button type="button" className="text-kumkum underline" onClick={() => void signOut()}>
              Sign out
            </button>
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Email" error={formState.errors.email?.message}>
            {(id, d) => <Input id={id} aria-describedby={d} type="email" autoComplete="username" {...register('email')} />}
          </Field>
          <Field label="Password" error={formState.errors.password?.message}>
            {(id, d) => <Input id={id} aria-describedby={d} type="password" autoComplete="current-password" {...register('password')} />}
          </Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
