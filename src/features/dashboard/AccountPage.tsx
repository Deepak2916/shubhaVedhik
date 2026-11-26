import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import type { ProfileRow } from '@/types/db'

export default function AccountPage() {
  useDocumentMeta({ title: 'Account · ShubhaVedhik', noindex: true })
  const { user } = useAuth()
  const toast = useToast()
  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => unwrap(await supabase.from('profiles').select('*').eq('id', user!.id).single()) as ProfileRow,
    enabled: Boolean(user),
  })
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.full_name ?? '')
      setPhone(profile.data.phone ?? '')
    }
  }, [profile.data])
  const save = useMutation({
    mutationFn: async () => unwrap(await supabase.from('profiles').update({ full_name: name.trim().slice(0, 120), phone: phone.trim().slice(0, 30) || null }).eq('id', user!.id)),
    onSuccess: () => toast.success('Account saved'),
    onError: (e) => toast.error(e.message),
  })
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">Account</h1>
      <Panel title="Your details" description="Only you can see these. They never appear on invitations.">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <Field label="Email">{(id) => <Input id={id} value={user?.email ?? ''} disabled />}</Field>
          <Field label="Name">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}</Field>
          <Field label="Phone" optional>{(id) => <Input id={id} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />}</Field>
          <Button type="submit" loading={save.isPending}>Save changes</Button>
        </form>
      </Panel>
      <Panel title="Password">
        <Link to="/forgot-password" className="text-kumkum hover:underline">Send me a password reset link</Link>
      </Panel>
    </div>
  )
}
