import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Chips, Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { LANGUAGES, RELIGIONS, TRADITION_SUGGESTIONS, languageName } from '@/lib/languages'
import type { LocalizedNames } from '@/lib/validation/invitation'
import { updateWedding } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

export default function CultureStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const [religion, setReligion] = useState(w.religion ?? '')
  const [languages, setLanguages] = useState<string[]>(w.languages.length ? w.languages : ['en'])
  const [primary, setPrimary] = useState(w.primary_language || 'en')
  const [traditions, setTraditions] = useState<string[]>(w.traditions)
  const [custom, setCustom] = useState('')
  const [localized, setLocalized] = useState<Record<string, LocalizedNames>>(w.localized ?? {})
  const [saving, setSaving] = useState(false)

  const suggestions = [...new Set([...(TRADITION_SUGGESTIONS[religion] ?? TRADITION_SUGGESTIONS.other), ...traditions])]
  const regional = languages.filter((l) => l !== 'en')
  const setLocal = (lang: string, key: keyof LocalizedNames, value: string) => setLocalized((x) => ({ ...x, [lang]: { ...x[lang], [key]: value } }))

  const save = async () => {
    if (languages.length === 0) {
      toast.error('Choose at least one language.')
      return false
    }
    setSaving(true)
    try {
      const cleanLocalized = Object.fromEntries(
        regional.map((l) => [l, Object.fromEntries(Object.entries(localized[l] ?? {}).filter(([, v]) => typeof v === 'string' && v.trim()).map(([k, v]) => [k, (v as string).trim().slice(0, k === 'invitationMessage' ? 2000 : 160)]))]),
      )
      await updateWedding(w.id, {
        religion: religion || null,
        languages,
        primary_language: languages.includes(primary) ? primary : languages[0],
        traditions: traditions.map((t) => t.slice(0, 60)).slice(0, 40),
        localized: cleanLocalized,
      })
      await refresh()
      toast.success('Saved')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return (
    <StepFrame title="Your traditions and languages" description="No two families celebrate the same way. Choose what you actually observe — the invitation follows your choices, not assumptions." onContinue={save} saving={saving}>
      <div className="space-y-6">
        <Panel title="Faith or tradition" description="Used to suggest ceremony names and to show or hide religious invocations such as a Bismillah or Ganesha vandana.">
          <Chips multiple={false} label="Religion" options={[{ value: '', label: 'Prefer not to say' }, ...RELIGIONS]} value={[religion]} onChange={(v) => setReligion(v[0] ?? '')} />
        </Panel>
        <Panel title="Languages" description="Guests can switch between these on the invitation.">
          <Chips label="Languages" options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.native}${l.code !== 'en' ? ` · ${l.name}` : ''}` }))} value={languages} onChange={setLanguages} />
          {languages.length > 1 && (
            <Field label="Show first in" className="mt-5 max-w-xs">
              {(id) => (
                <Select id={id} value={primary} onChange={(e) => setPrimary(e.target.value)}>
                  {languages.map((l) => (
                    <option key={l} value={l}>{languageName(l)}</option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </Panel>
        <Panel title="Ceremonies you observe" description="Select the ones that apply, or add your own. You’ll add dates and venues in the Events step.">
          <Chips label="Ceremonies" options={suggestions.map((s) => ({ value: s, label: s }))} value={traditions} onChange={setTraditions} />
          <form
            className="mt-4 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const t = custom.trim()
              if (t && !traditions.includes(t)) setTraditions([...traditions, t])
              setCustom('')
            }}
          >
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a ceremony, e.g. Gauri Puja" aria-label="Add a ceremony" maxLength={60} />
            <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-full bg-plum text-paper" aria-label="Add ceremony">
              <Plus className="size-4" />
            </button>
          </form>
        </Panel>
        {regional.map((lang) => (
          <Panel key={lang} title={`In ${languageName(lang)}`} description="Shown alongside English in the matching script. Leave anything blank to skip it.">
            <div className="grid gap-5 sm:grid-cols-2" lang={lang}>
              <Field label="Bride’s name">{(id) => <Input id={id} value={localized[lang]?.brideName ?? ''} onChange={(e) => setLocal(lang, 'brideName', e.target.value)} />}</Field>
              <Field label="Groom’s name">{(id) => <Input id={id} value={localized[lang]?.groomName ?? ''} onChange={(e) => setLocal(lang, 'groomName', e.target.value)} />}</Field>
              <Field label="Headline" className="sm:col-span-2" hint="e.g. శుభ వివాహ ఆహ్వానం, शुभ विवाह, دعوتِ نکاح">
                {(id, d) => <Input id={id} aria-describedby={d} value={localized[lang]?.headline ?? ''} onChange={(e) => setLocal(lang, 'headline', e.target.value)} />}
              </Field>
              <Field label="Invitation message" className="sm:col-span-2">
                {(id) => <Textarea id={id} rows={3} value={localized[lang]?.invitationMessage ?? ''} onChange={(e) => setLocal(lang, 'invitationMessage', e.target.value)} />}
              </Field>
            </div>
          </Panel>
        ))}
        {traditions.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-mist">
            Selected:
            {traditions.map((t) => (
              <button key={t} type="button" onClick={() => setTraditions(traditions.filter((x) => x !== t))} className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-0.5 text-plum" aria-label={`Remove ${t}`}>
                {t} <X className="size-3" aria-hidden />
              </button>
            ))}
          </p>
        )}
      </div>
    </StepFrame>
  )
}
