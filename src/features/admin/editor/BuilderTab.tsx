import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Lock, Palette, Plus, Rocket, Save, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { ColorField, Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Badge, PageLoader, Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { LivePreviewFrame } from '@/components/LivePreviewFrame'
import { cn } from '@/lib/cn'
import { FONTS } from '@/lib/fonts'
import { invitationDataSchema } from '@/lib/validation/invitation'
import {
  ANIMATION_PRESETS,
  FONT_KEYS,
  MESSAGE_KINDS,
  MOTIFS,
  OPENING_STYLES,
  REVEALS,
  SECTION_LABELS,
  SECTION_TYPES,
  SECTION_VARIANTS,
  templateConfigSchema,
  type SectionConfig,
  type SectionType,
  type TemplateConfig,
} from '@/lib/validation/template'
import { discardDraft, ensureDraft, getVersion, listLibrary, listVersions, presetFor, publishVersion, saveDraft, type AdminTemplate, type EditableSection } from '../api'

const GLOBAL = '__global__'

function fontOptions() {
  return FONT_KEYS.map((k) => (
    <option key={k} value={k}>
      {FONTS[k].family}
    </option>
  ))
}

// ---------------------------------------------------------------- global settings
function GlobalInspector({ config, set, readOnly }: { config: TemplateConfig; set: (c: TemplateConfig) => void; readOnly: boolean }) {
  const library = useQuery({ queryKey: ['admin-library'], queryFn: listLibrary })
  const theme = config.theme
  const patch = <K extends keyof TemplateConfig>(k: K, v: Partial<TemplateConfig[K]>) => set({ ...config, [k]: { ...(config[k] as object), ...v } })
  return (
    <fieldset disabled={readOnly} className="space-y-6">
      <Panel title="Colour palette" className="!p-5">
        <div className="grid grid-cols-2 gap-4">
          {(['background', 'surface', 'text', 'muted', 'primary', 'accent', 'onPrimary', 'border'] as const).map((k) => (
            <ColorField key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} value={theme.palette[k] ?? '#000000'} onChange={(v) => patch('theme', { palette: { ...theme.palette, [k]: v } })} />
          ))}
        </div>
        <div className="mt-5">
          <Switch checked={config.customizable.palette} onChange={(v) => set({ ...config, customizable: { palette: v } })} label="Customers can adjust colours" />
        </div>
      </Panel>
      <Panel title="Typography" className="!p-5">
        <div className="grid gap-4">
          <Field label="Display (headings, names)">{(id) => <Select id={id} value={theme.fonts.display} onChange={(e) => patch('theme', { fonts: { ...theme.fonts, display: e.target.value as typeof theme.fonts.display } })}>{fontOptions()}</Select>}</Field>
          <Field label="Body text">{(id) => <Select id={id} value={theme.fonts.body} onChange={(e) => patch('theme', { fonts: { ...theme.fonts, body: e.target.value as typeof theme.fonts.body } })}>{fontOptions()}</Select>}</Field>
          <Field label="Script (optional)">{(id) => <Select id={id} value={theme.fonts.script ?? ''} onChange={(e) => patch('theme', { fonts: { ...theme.fonts, script: (e.target.value || undefined) as typeof theme.fonts.script } })}><option value="">Same as display</option>{fontOptions()}</Select>}</Field>
          <Field label="Accent / regional script (optional)">{(id) => <Select id={id} value={theme.fonts.accent ?? ''} onChange={(e) => patch('theme', { fonts: { ...theme.fonts, accent: (e.target.value || undefined) as typeof theme.fonts.accent } })}><option value="">Same as display</option>{fontOptions()}</Select>}</Field>
          <Field label="Heading case">{(id) => <Select id={id} value={theme.headingCase} onChange={(e) => patch('theme', { headingCase: e.target.value as 'normal' | 'upper' })}><option value="normal">As written</option><option value="upper">Small capitals feel (uppercase, tracked)</option></Select>}</Field>
        </div>
      </Panel>
      <Panel title="Ornament & texture" className="!p-5">
        <div className="grid gap-4">
          <Field label="Motif set">{(id) => <Select id={id} value={theme.motif} onChange={(e) => patch('theme', { motif: e.target.value as TemplateConfig['theme']['motif'] })}>{MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label="Texture">{(id) => <Select id={id} value={theme.texture} onChange={(e) => patch('theme', { texture: e.target.value as TemplateConfig['theme']['texture'] })}>{['none', 'paper', 'silk', 'grain', 'linen'].map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label="Corner shape">{(id) => <Select id={id} value={theme.radius} onChange={(e) => patch('theme', { radius: e.target.value as TemplateConfig['theme']['radius'] })}>{['none', 'soft', 'round', 'arch'].map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label={`Ornament intensity: ${Math.round(theme.ornament * 100)}%`}>{(id) => <input id={id} type="range" min={0} max={1} step={0.05} value={theme.ornament} onChange={(e) => patch('theme', { ornament: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}</Field>
        </div>
      </Panel>
      <Panel title="Opening scene" className="!p-5">
        <div className="grid gap-4">
          <Field label="Style">{(id) => <Select id={id} value={config.opening.style} onChange={(e) => patch('opening', { style: e.target.value as TemplateConfig['opening']['style'] })}>{OPENING_STYLES.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label="Eyebrow / invocation" hint="Faith-specific text is hidden automatically for couples of another faith.">{(id, d) => <Input id={id} aria-describedby={d} value={config.opening.eyebrow} maxLength={120} onChange={(e) => patch('opening', { eyebrow: e.target.value })} />}</Field>
          <Field label="Title">{(id) => <Input id={id} value={config.opening.title} maxLength={120} onChange={(e) => patch('opening', { title: e.target.value })} />}</Field>
          <Field label="Button label">{(id) => <Input id={id} value={config.opening.buttonLabel} maxLength={40} onChange={(e) => patch('opening', { buttonLabel: e.target.value })} />}</Field>
          <Field label="Background image URL" optional>{(id) => <Input id={id} value={config.opening.backgroundImage ?? ''} onChange={(e) => patch('opening', { backgroundImage: e.target.value || undefined })} />}</Field>
          <Switch checked={config.opening.showDate} onChange={(v) => patch('opening', { showDate: v })} label="Show the wedding date" />
        </div>
      </Panel>
      <Panel title="Animation" className="!p-5">
        <div className="grid gap-4">
          <Field label="Preset">{(id) => <Select id={id} value={config.animation.preset} onChange={(e) => patch('animation', { preset: e.target.value as TemplateConfig['animation']['preset'] })}>{ANIMATION_PRESETS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label="Section reveal">{(id) => <Select id={id} value={config.animation.reveal} onChange={(e) => patch('animation', { reveal: e.target.value as TemplateConfig['animation']['reveal'] })}>{REVEALS.map((m) => <option key={m} value={m}>{m}</option>)}</Select>}</Field>
          <Field label={`Duration: ${config.animation.duration.toFixed(1)}s`}>{(id) => <input id={id} type="range" min={0.2} max={2} step={0.1} value={config.animation.duration} onChange={(e) => patch('animation', { duration: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}</Field>
          <Field label={`Stagger: ${config.animation.stagger.toFixed(2)}s`}>{(id) => <input id={id} type="range" min={0} max={0.5} step={0.02} value={config.animation.stagger} onChange={(e) => patch('animation', { stagger: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}</Field>
          <Switch checked={config.animation.ambient} onChange={(v) => patch('animation', { ambient: v })} label="Ambient effects" description="Falling petals, rotating mandalas. Always off for reduced-motion users." />
        </div>
      </Panel>
      <Panel title="Music" className="!p-5">
        <div className="grid gap-4">
          <Switch checked={config.music.enabled} onChange={(v) => patch('music', { enabled: v })} label="Supports background music" />
          <Field label="Default track" hint="Plays when the couple hasn’t chosen their own.">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={config.music.defaultTrackUrl ?? ''} onChange={(e) => {
                const t = library.data?.find((x) => x.url === e.target.value)
                patch('music', { defaultTrackUrl: e.target.value || undefined, defaultTrackTitle: t?.title ?? undefined })
              }}>
                <option value="">None</option>
                {library.data?.map((t) => <option key={t.id} value={t.url}>{t.title}</option>)}
              </Select>
            )}
          </Field>
          <Field label={`Default volume: ${Math.round(config.music.volume * 100)}%`}>{(id) => <input id={id} type="range" min={0} max={1} step={0.05} value={config.music.volume} onChange={(e) => patch('music', { volume: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}</Field>
        </div>
      </Panel>
    </fieldset>
  )
}

// ---------------------------------------------------------------- section inspector
function SectionInspector({ s, set, readOnly, takenKeys }: { s: EditableSection; set: (s: EditableSection) => void; readOnly: boolean; takenKeys: string[] }) {
  const c = s.config
  const patch = (v: Partial<SectionConfig>) => set({ ...s, config: Object.fromEntries(Object.entries({ ...c, ...v }).filter(([, x]) => x !== '' && x !== undefined)) as SectionConfig })
  const keyError = !/^[a-z0-9_-]{1,40}$/.test(s.key) ? 'Lowercase letters, numbers, - and _' : takenKeys.includes(s.key) ? 'Already used by another section' : undefined
  return (
    <fieldset disabled={readOnly} className="space-y-6">
      <Panel title={SECTION_LABELS[s.type]} className="!p-5">
        <div className="grid gap-4">
          <Field label="Layout">{(id) => <Select id={id} value={c.variant ?? ''} onChange={(e) => patch({ variant: e.target.value || undefined })}><option value="">Default</option>{SECTION_VARIANTS[s.type].map((v) => <option key={v} value={v}>{v}</option>)}</Select>}</Field>
          <Field label="Section key" error={keyError} hint="Anchor id; unique within the version.">{(id, d) => <Input id={id} aria-describedby={d} value={s.key} onChange={(e) => set({ ...s, key: e.target.value.toLowerCase() })} />}</Field>
          <Switch checked={s.enabled} onChange={(v) => set({ ...s, enabled: v })} label="Visible" />
        </div>
      </Panel>
      <Panel title="Content placeholders" description="Use {{bride}} {{groom}} {{date}} {{time}} {{city}} {{venue}}." className="!p-5">
        <div className="grid gap-4">
          <Field label="Eyebrow">{(id) => <Input id={id} value={c.eyebrow ?? ''} maxLength={200} onChange={(e) => patch({ eyebrow: e.target.value })} />}</Field>
          <Field label="Title">{(id) => <Input id={id} value={c.title ?? ''} maxLength={200} onChange={(e) => patch({ title: e.target.value })} />}</Field>
          <Field label="Subtitle">{(id) => <Input id={id} value={c.subtitle ?? ''} maxLength={300} onChange={(e) => patch({ subtitle: e.target.value })} />}</Field>
          <Field label="Body (fallback text)">{(id) => <Textarea id={id} rows={3} value={c.body ?? ''} maxLength={2000} onChange={(e) => patch({ body: e.target.value })} />}</Field>
          {s.type === 'message' && (
            <Field label="Shows messages of type">{(id) => <Select id={id} value={c.messageKind ?? 'custom'} onChange={(e) => patch({ messageKind: e.target.value as SectionConfig['messageKind'] })}>{MESSAGE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</Select>}</Field>
          )}
          {s.type === 'gallery' && <Field label="Maximum photos">{(id) => <Input id={id} type="number" min={1} max={60} value={c.limit ?? 24} onChange={(e) => patch({ limit: Math.max(1, Math.min(60, Number(e.target.value))) })} />}</Field>}
        </div>
      </Panel>
      <Panel title="Appearance" className="!p-5">
        <div className="grid gap-4">
          <Field label="Background">{(id) => <Select id={id} value={c.background ?? ''} onChange={(e) => patch({ background: (e.target.value || undefined) as SectionConfig['background'] })}><option value="">Default</option><option value="base">Base</option><option value="surface">Surface</option><option value="primary">Primary colour</option><option value="image">Image</option></Select>}</Field>
          {c.background === 'image' && (
            <>
              <Field label="Background image URL">{(id) => <Input id={id} value={c.backgroundImage ?? ''} onChange={(e) => patch({ backgroundImage: e.target.value })} />}</Field>
              <Field label={`Overlay: ${Math.round((c.overlay ?? 0.7) * 100)}%`}>{(id) => <input id={id} type="range" min={0} max={1} step={0.05} value={c.overlay ?? 0.7} onChange={(e) => patch({ overlay: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}</Field>
            </>
          )}
          <Field label="Alignment">{(id) => <Select id={id} value={c.align ?? ''} onChange={(e) => patch({ align: (e.target.value || undefined) as SectionConfig['align'] })}><option value="">Default</option><option value="center">Centre</option><option value="left">Left</option></Select>}</Field>
          <Field label="Spacing">{(id) => <Select id={id} value={c.spacing ?? ''} onChange={(e) => patch({ spacing: (e.target.value || undefined) as SectionConfig['spacing'] })}><option value="">Normal</option><option value="compact">Compact</option><option value="airy">Airy</option></Select>}</Field>
          <Field label="Reveal animation">{(id) => <Select id={id} value={c.reveal ?? ''} onChange={(e) => patch({ reveal: (e.target.value || undefined) as SectionConfig['reveal'] })}><option value="">Template default</option>{REVEALS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>}</Field>
          <Switch checked={c.ornament !== false} onChange={(v) => patch({ ornament: v ? undefined : false })} label="Ornaments" />
        </div>
      </Panel>
    </fieldset>
  )
}

// ---------------------------------------------------------------- builder
export default function BuilderTab({ t }: { t: AdminTemplate }) {
  const qc = useQueryClient()
  const toast = useToast()
  const versions = useQuery({ queryKey: ['admin-versions', t.id], queryFn: () => listVersions(t.id) })
  const draft = versions.data?.find((v) => v.status === 'draft')
  const current = versions.data?.find((v) => v.id === t.current_version_id) ?? versions.data?.[0]
  const editingId = draft?.id ?? current?.id
  const readOnly = !draft
  const loaded = useQuery({ queryKey: ['admin-version', editingId], queryFn: () => getVersion(editingId!), enabled: Boolean(editingId) })

  const [config, setConfig] = useState<TemplateConfig | null>(null)
  const [sections, setSections] = useState<EditableSection[]>([])
  const [selected, setSelected] = useState<string>(GLOBAL)
  const [dirty, setDirty] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [changelog, setChangelog] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!loaded.data) return
    const parsed = templateConfigSchema.safeParse(loaded.data.version.config)
    setConfig(parsed.success ? parsed.data : templateConfigSchema.parse(presetFor(null).config))
    setSections(loaded.data.sections.map((s) => ({ id: s.id, key: s.section_key, type: s.type, enabled: s.enabled, config: s.config })))
    setDirty(false)
  }, [loaded.data])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const sample = useMemo(() => {
    const r = invitationDataSchema.safeParse(t.sample_data)
    return r.success ? r.data : invitationDataSchema.parse(presetFor(t.slug).sample)
  }, [t.sample_data, t.slug])

  const validation = config ? templateConfigSchema.safeParse(config) : null
  const keys = sections.map((s) => s.key)
  const keyProblem = keys.some((k, i) => keys.indexOf(k) !== i || !/^[a-z0-9_-]{1,40}$/.test(k))
  const valid = Boolean(validation?.success) && !keyProblem

  const refetch = async () => {
    await qc.invalidateQueries({ queryKey: ['admin-versions', t.id] })
    await qc.invalidateQueries({ queryKey: ['admin-template', t.id] })
    await qc.invalidateQueries({ queryKey: ['admin-templates'] })
  }
  const startDraft = useMutation({ mutationFn: () => ensureDraft(t.id), onSuccess: async () => (await refetch(), toast.success('Draft created — edit freely, nothing changes for customers until you publish')), onError: (e) => toast.error(e.message) })
  const save = useMutation({
    mutationFn: () => saveDraft(draft!.id, config!, sections, loaded.data!.sections),
    onSuccess: async () => (await qc.invalidateQueries({ queryKey: ['admin-version', draft!.id] }), toast.success('Draft saved')),
    onError: (e) => toast.error(e.message),
  })
  const publish = useMutation({
    mutationFn: async () => {
      if (dirty) await saveDraft(draft!.id, config!, sections, loaded.data!.sections)
      await publishVersion(draft!.id, changelog)
    },
    onSuccess: async () => {
      setPublishing(false)
      setChangelog('')
      await refetch()
      toast.success(`Version ${draft!.version} published. Existing weddings keep their version until they choose to update.`)
    },
    onError: (e) => toast.error(e.message),
  })
  const discard = useMutation({ mutationFn: () => discardDraft(draft!.id), onSuccess: async () => (setConfirmDiscard(false), await refetch(), toast.success('Draft discarded')), onError: (e) => toast.error(e.message) })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && draft && valid) {
        e.preventDefault()
        save.mutate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft, valid, save])

  if (versions.isLoading || loaded.isLoading || !config) return <PageLoader />

  const update = (fn: () => void) => {
    fn()
    setDirty(true)
  }
  const setSection = (i: number, s: EditableSection) => update(() => setSections((all) => all.map((x, j) => (j === i ? s : x))))
  const move = (from: number, to: number) => update(() => setSections((all) => { const a = [...all]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a }))
  const addSection = (type: SectionType) =>
    update(() => {
      let key: string = type
      let n = 2
      while (keys.includes(key)) key = `${type}-${n++}`
      setSections((all) => [...all, { key, type, enabled: true, config: { variant: SECTION_VARIANTS[type][0] } }])
      setSelected(key)
    })
  const selIndex = sections.findIndex((s) => s.key === selected)
  const sel = selIndex >= 0 ? sections[selIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-rose/60">
        {readOnly ? (
          <>
            <Lock className="size-4 text-mist" aria-hidden />
            <p className="flex-1 text-sm">
              Viewing <strong>v{current?.version}</strong> ({current?.status}). Published versions are immutable so live invitations never change unexpectedly.
            </p>
            <Button size="sm" loading={startDraft.isPending} onClick={() => startDraft.mutate()}>
              Start editing v{(versions.data?.[0]?.version ?? 0) + 1}
            </Button>
          </>
        ) : (
          <>
            <Badge tone="warning">Draft v{draft.version}</Badge>
            <p className="flex-1 text-sm text-mist">{dirty ? 'Unsaved changes' : 'All changes saved'}{!valid && <span className="ml-2 text-danger">— fix invalid settings to save</span>}</p>
            <Button size="sm" variant="ghost" icon={<Undo2 className="size-4" aria-hidden />} onClick={() => setConfirmDiscard(true)}>Discard draft</Button>
            <Button size="sm" variant="secondary" icon={<Save className="size-4" aria-hidden />} disabled={!dirty || !valid} loading={save.isPending} onClick={() => save.mutate()}>Save draft</Button>
            <Button size="sm" icon={<Rocket className="size-4" aria-hidden />} disabled={!valid} onClick={() => setPublishing(true)}>Publish v{draft.version}</Button>
          </>
        )}
      </div>
      {validation && !validation.success && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
          {validation.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ')}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,360px)_1fr]">
        <div className="space-y-3">
          <button type="button" onClick={() => setSelected(GLOBAL)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ring-1', selected === GLOBAL ? 'bg-plum text-paper ring-plum' : 'bg-white ring-rose/70 hover:ring-plum/30')}>
            <Palette className="size-4" aria-hidden /> Theme, opening & music
          </button>
          <ol className="space-y-1.5" aria-label="Sections">
            {sections.map((s, i) => (
              <li
                key={`${s.id ?? 'new'}-${i}`}
                draggable={!readOnly}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragIndex !== null && dragIndex !== i && move(dragIndex, i)}
                onDragEnd={() => setDragIndex(null)}
                className={cn('group flex items-center gap-1 rounded-xl bg-white pr-1 text-sm ring-1', selected === s.key ? 'ring-2 ring-kumkum' : 'ring-rose/70', !s.enabled && 'opacity-60', dragIndex === i && 'opacity-30')}
              >
                <GripVertical className="ml-1 size-4 shrink-0 cursor-grab text-mist" aria-hidden />
                <button type="button" onClick={() => setSelected(s.key)} className="min-w-0 flex-1 truncate py-2.5 text-left">
                  {SECTION_LABELS[s.type]}
                  <span className="ml-1.5 text-xs text-mist">{s.config.variant}</span>
                </button>
                {!readOnly && (
                  <span className="flex opacity-70 group-hover:opacity-100">
                    <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="grid size-7 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move up"><ChevronUp className="size-3.5" /></button>
                    <button type="button" disabled={i === sections.length - 1} onClick={() => move(i, i + 1)} className="grid size-7 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move down"><ChevronDown className="size-3.5" /></button>
                    <button type="button" onClick={() => setSection(i, { ...s, enabled: !s.enabled })} className="grid size-7 place-items-center rounded-full hover:bg-blush" aria-label={s.enabled ? 'Hide section' : 'Show section'}>{s.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</button>
                    <button type="button" onClick={() => update(() => setSections((all) => all.filter((_, j) => j !== i)))} className="grid size-7 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Remove section"><Trash2 className="size-3.5" /></button>
                  </span>
                )}
              </li>
            ))}
          </ol>
          {!readOnly && (
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-rose bg-white px-3">
              <Plus className="size-4 text-kumkum" aria-hidden />
              <span className="sr-only">Add section</span>
              <select value="" onChange={(e) => e.target.value && addSection(e.target.value as SectionType)} className="h-10 flex-1 bg-transparent text-sm outline-none">
                <option value="">Add a section…</option>
                {SECTION_TYPES.map((tp) => <option key={tp} value={tp}>{SECTION_LABELS[tp]}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="lg:max-h-[calc(100svh-12rem)] lg:overflow-y-auto lg:pr-1">
          {selected === GLOBAL || !sel ? (
            <GlobalInspector config={config} set={(c) => update(() => setConfig(c))} readOnly={readOnly} />
          ) : (
            <SectionInspector
              s={sel}
              readOnly={readOnly}
              takenKeys={keys.filter((_, j) => j !== selIndex)}
              set={(s) => {
                setSection(selIndex, s)
                if (s.key !== sel.key) setSelected(s.key)
              }}
            />
          )}
        </div>

        <LivePreviewFrame template={{ slug: t.slug, name: t.name, config, sections }} data={sample} scrollTo={selected === GLOBAL ? undefined : selected} className="h-[calc(100svh-12rem)] min-h-[560px] lg:sticky lg:top-6" />
      </div>

      <Dialog
        open={publishing}
        onClose={() => setPublishing(false)}
        title={`Publish version ${draft?.version}`}
        description="New weddings get this version immediately. Existing weddings stay on their version and see an optional update."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPublishing(false)}>Cancel</Button>
            <Button loading={publish.isPending} onClick={() => publish.mutate()}>Publish</Button>
          </>
        }
      >
        <Field label="What changed?" optional>{(id) => <Textarea id={id} rows={3} maxLength={1000} value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Warmer gold, new arch-card event layout…" />}</Field>
      </Dialog>
      <ConfirmDialog open={confirmDiscard} title="Discard this draft?" body="All unpublished changes in this version will be lost." confirmLabel="Discard draft" danger loading={discard.isPending} onConfirm={() => discard.mutate()} onClose={() => setConfirmDiscard(false)} />
    </div>
  )
}
