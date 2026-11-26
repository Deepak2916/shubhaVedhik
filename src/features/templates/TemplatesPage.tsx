import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chips } from '@/components/ui/Field'
import { EmptyState, Skeleton } from '@/components/ui/Primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { CULTURE_FILTERS, useCategories, usePublishedTemplates } from './api'
import { TemplateCard } from './TemplateCard'

export default function TemplatesPage() {
  useDocumentMeta({ title: 'Wedding invitation designs · ShubhaVedhik', description: 'Royal, traditional, floral, modern and cinematic invitation designs for every Indian wedding.' })
  const templates = usePublishedTemplates()
  const categories = useCategories()
  const [params] = useSearchParams()
  const [category, setCategory] = useState<string[]>(() => (params.get('style') ? [params.get('style') as string] : []))
  const [culture, setCulture] = useState<string[]>([])

  const filtered = useMemo(
    () =>
      (templates.data ?? []).filter(
        (t) => (category.length === 0 || (t.category && category.includes(t.category.slug))) && (culture.length === 0 || culture.some((c) => t.cultural_tags.includes(c))),
      ),
    [templates.data, category, culture],
  )
  const usedCategories = (categories.data ?? []).filter((c) => templates.data?.some((t) => t.category?.slug === c.slug))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.02]">Find the invitation that feels like your family</h1>
        <p className="mt-4 text-lg text-mist">Every design opens with its own animation, plays your music and works in English plus your regional language. Open any of them to see the full experience.</p>
      </header>
      <div className="mt-10 space-y-4 border-y border-rose py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="w-20 shrink-0 text-sm font-medium">Style</span>
          <Chips label="Style" options={usedCategories.map((c) => ({ value: c.slug, label: c.name }))} value={category} onChange={setCategory} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="w-20 shrink-0 text-sm font-medium">Tradition</span>
          <Chips label="Tradition" options={CULTURE_FILTERS} value={culture} onChange={setCulture} />
        </div>
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {templates.isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-[18px]" />)}
        {filtered.map((t) => (
          <TemplateCard key={t.id} t={t} />
        ))}
      </div>
      {!templates.isLoading && filtered.length === 0 && (
        <EmptyState title="No designs match those filters" body="Any design can be personalised for any tradition — clear a filter to see more." action={<button type="button" className="text-kumkum underline" onClick={() => (setCategory([]), setCulture([]))}>Clear filters</button>} />
      )}
    </div>
  )
}
