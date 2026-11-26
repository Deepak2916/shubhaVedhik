import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { getTemplateBySlug } from '@/features/templates/api'
import { createWedding } from '@/features/weddings/api'

const schema = z.object({
  brideName: z.string().trim().min(1, 'Enter the bride’s name').max(80),
  groomName: z.string().trim().min(1, 'Enter the groom’s name').max(80),
})

export function NewWeddingDialog({ open, onClose, templateSlug }: { open: boolean; onClose: () => void; templateSlug?: string | null }) {
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const tpl = useQuery({ queryKey: ['template', templateSlug], queryFn: () => getTemplateBySlug(templateSlug ?? ''), enabled: Boolean(templateSlug) })
  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  const create = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => createWedding(v.groomName, v.brideName, tpl.data?.id ?? null),
    onSuccess: (w) => {
      qc.invalidateQueries({ queryKey: ['weddings'] })
      toast.success('Wedding created')
      reset()
      onClose()
      navigate(`/dashboard/weddings/${w.id}/edit/details`)
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Start a new invitation"
      description={tpl.data ? `Using the ${tpl.data.name} design. You can change it later.` : 'You can change everything later.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-wedding" loading={create.isPending}>Create wedding</Button>
        </>
      }
    >
      <form id="new-wedding" onSubmit={handleSubmit((v) => create.mutate(v))} className="grid gap-5 sm:grid-cols-2" noValidate>
        <Field label="Bride’s name" error={formState.errors.brideName?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} autoComplete="off" placeholder="e.g. Priya Reddy" {...register('brideName')} />}
        </Field>
        <Field label="Groom’s name" error={formState.errors.groomName?.message}>
          {(id, d) => <Input id={id} aria-describedby={d} autoComplete="off" placeholder="e.g. Rahul Varma" {...register('groomName')} />}
        </Field>
        <p className="text-sm text-mist sm:col-span-2">We’ll suggest a link like <span className="font-medium text-plum">/w/rahul-weds-priya</span> from these names.</p>
      </form>
    </Dialog>
  )
}
