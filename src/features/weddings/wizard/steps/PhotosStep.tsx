import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Select } from '@/components/ui/Field'
import { EmptyState, Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { Dropzone, UploadQueue, useUploadQueue } from '@/features/media/Dropzone'
import { cn } from '@/lib/cn'
import { PHOTO_KINDS, type PhotoKind } from '@/lib/validation/invitation'
import { deletePhoto, listPhotos, reorder, updatePhoto, updateWedding, uploadPhoto, type PhotoItem } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

const KIND_LABEL: Record<PhotoKind, string> = {
  bride: 'Bride portrait',
  groom: 'Groom portrait',
  couple: 'Couple',
  engagement: 'Engagement',
  prewedding: 'Pre-wedding',
  family: 'Family',
  other: 'Other',
}
const MAX_PHOTOS = 60

export default function PhotosStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const qc = useQueryClient()
  const key = ['photos', w.id]
  const photos = useQuery({ queryKey: key, queryFn: () => listPhotos(w.id) })
  const [kind, setKind] = useState<PhotoKind>('couple')
  const [drag, setDrag] = useState<string | null>(null)
  const queue = useUploadQueue()
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const upload = async (files: File[]) => {
    const room = MAX_PHOTOS - (photos.data?.length ?? 0)
    if (room <= 0) return toast.error(`You can add up to ${MAX_PHOTOS} photos.`)
    if (files.length > room) toast.info(`Only the first ${room} photos will be added (limit ${MAX_PHOTOS}).`)
    await queue.run(files.slice(0, room), (f, p) => uploadPhoto(w, f, kind, p))
    await invalidate()
    await refresh()
  }

  const patch = useMutation({ mutationFn: ({ id, ...p }: { id: string; caption?: string | null; kind?: PhotoKind }) => updatePhoto(id, p), onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  const remove = useMutation({ mutationFn: (p: PhotoItem) => deletePhoto(p), onSuccess: async () => (await invalidate(), await refresh(), toast.success('Photo removed')), onError: (e) => toast.error(e.message) })
  const setCover = useMutation({ mutationFn: (id: string) => updateWedding(w.id, { cover_photo_id: id }), onSuccess: async () => (await refresh(), toast.success('Cover photo set')), onError: (e) => toast.error(e.message) })

  const move = async (ids: string[]) => {
    qc.setQueryData<PhotoItem[]>(key, (old) => ids.map((id) => old!.find((p) => p.id === id)!))
    try {
      await reorder('wedding_photos', ids)
    } catch (e) {
      toast.error((e as Error).message)
      await invalidate()
    }
  }
  const shift = (id: string, d: number) => {
    const ids = photos.data!.map((p) => p.id)
    const i = ids.indexOf(id)
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void move(ids)
  }

  return (
    <StepFrame title="Photos" description="Portraits, engagement and pre-wedding photos. We resize and optimise every photo so the invitation stays fast on mobile data." onContinue={() => true} continueLabel="Continue">
      <Panel>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label htmlFor="photo-kind" className="text-sm font-medium">
            Upload as
          </label>
          <Select id="photo-kind" value={kind} onChange={(e) => setKind(e.target.value as PhotoKind)} className="w-48">
            {PHOTO_KINDS.map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </Select>
          <span className="text-sm text-mist">Tip: add one bride and one groom portrait to show them side by side.</span>
        </div>
        <Dropzone accept="image/jpeg,image/png,image/webp" multiple onFiles={(f) => void upload(f)} title="Drop photos here" hint={`JPEG, PNG or WebP, up to 25 MB each. ${photos.data?.length ?? 0} of ${MAX_PHOTOS} used.`} />
        <UploadQueue jobs={queue.jobs} />
      </Panel>

      <div className="mt-8">
        {photos.isLoading && <Skeleton className="h-60" />}
        {photos.data?.length === 0 && <EmptyState title="No photos yet" body="Your invitation will use the design’s artwork until you add photos." />}
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {photos.data?.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDrag(p.id)}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!drag || drag === p.id) return
                const ids = photos.data!.map((x) => x.id).filter((x) => x !== drag)
                ids.splice(ids.indexOf(p.id), 0, drag)
                void move(ids)
              }}
              className={cn('overflow-hidden rounded-2xl bg-white ring-1 ring-rose/70', drag === p.id && 'opacity-40', w.cover_photo_id === p.id && 'ring-2 ring-haldi')}
            >
              <div className="relative aspect-square bg-blush">
                <img src={p.thumbUrl} alt={p.caption ?? ''} loading="lazy" className="size-full object-cover" />
                {w.cover_photo_id === p.id && <span className="absolute top-2 left-2 rounded-full bg-haldi px-2 py-0.5 text-xs font-medium text-plum">Cover</span>}
              </div>
              <div className="space-y-2 p-3">
                <Select aria-label="Photo type" value={p.kind} onChange={(e) => patch.mutate({ id: p.id, kind: e.target.value as PhotoKind })} className="h-9 text-sm">
                  {PHOTO_KINDS.map((k) => (
                    <option key={k} value={k}>{KIND_LABEL[k]}</option>
                  ))}
                </Select>
                <input
                  aria-label="Caption"
                  defaultValue={p.caption ?? ''}
                  maxLength={300}
                  placeholder="Add a caption"
                  onBlur={(e) => e.target.value !== (p.caption ?? '') && patch.mutate({ id: p.id, caption: e.target.value.trim() || null })}
                  className="h-9 w-full rounded-lg px-2 text-sm ring-1 ring-rose focus:outline-none focus:ring-kumkum/50"
                />
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => shift(p.id, -1)} disabled={i === 0} className="grid size-8 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move earlier">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" onClick={() => shift(p.id, 1)} disabled={i === photos.data!.length - 1} className="grid size-8 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move later">
                    <ChevronRight className="size-4" />
                  </button>
                  <button type="button" onClick={() => setCover.mutate(p.id)} className="ml-auto grid size-8 place-items-center rounded-full hover:bg-blush" aria-label="Use as cover photo" aria-pressed={w.cover_photo_id === p.id}>
                    <Star className={cn('size-4', w.cover_photo_id === p.id && 'fill-haldi text-haldi')} />
                  </button>
                  <button type="button" onClick={() => remove.mutate(p)} className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete photo">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </StepFrame>
  )
}
