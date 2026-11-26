import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { invitationDataSchema } from '@/lib/validation/invitation'
import { presetFor, updateTemplate, type AdminTemplate } from '../api'

/** JSON editor for the sample wedding used in previews and demos, validated against the renderer's schema. */
export default function SampleDataTab({ t }: { t: AdminTemplate }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [text, setText] = useState(() => JSON.stringify(t.sample_data, null, 2))
  const result = useMemo(() => {
    try {
      const parsed = invitationDataSchema.safeParse(JSON.parse(text))
      return parsed.success ? { ok: true as const, value: parsed.data } : { ok: false as const, error: parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join('\n') }
    } catch (e) {
      return { ok: false as const, error: `Invalid JSON: ${(e as Error).message}` }
    }
  }, [text])
  const save = useMutation({
    mutationFn: () => updateTemplate(t.id, { sample_data: result.ok ? (result.value as unknown as Record<string, unknown>) : {} }),
    onSuccess: () => (qc.invalidateQueries({ queryKey: ['admin-template', t.id] }), toast.success('Sample wedding saved')),
    onError: (e) => toast.error(e.message),
  })
  return (
    <Panel
      title="Sample wedding"
      description="Shown in template previews, demos and the builder. Same structure as a real invitation; image and audio URLs may be absolute or site-relative."
      actions={<Button size="sm" variant="ghost" onClick={() => setText(JSON.stringify(presetFor(t.slug).sample, null, 2))}>Load preset sample</Button>}
    >
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Sample wedding JSON" className="h-[60vh] w-full rounded-xl bg-plum p-4 font-mono text-xs leading-relaxed text-paper focus:outline-none focus:ring-2 focus:ring-haldi" />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button disabled={!result.ok} loading={save.isPending} onClick={() => save.mutate()}>Save sample</Button>
        {result.ok ? <span className="text-sm text-leaf">Valid</span> : <pre className="text-sm whitespace-pre-wrap text-danger">{result.error}</pre>}
      </div>
    </Panel>
  )
}
