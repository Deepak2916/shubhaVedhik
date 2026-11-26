import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { EmptyState, Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { Dropzone, UploadQueue, useUploadQueue } from '@/features/media/Dropzone'
import { formatBytes } from '@/lib/format'
import { deleteVideo, listVideos, reorder, updateVideo, uploadVideo, type VideoItem } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

const MAX_VIDEOS = 6

export default function VideosStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const qc = useQueryClient()
  const key = ['videos', w.id]
  const videos = useQuery({ queryKey: key, queryFn: () => listVideos(w.id) })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queue = useUploadQueue()
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const upload = async (files: File[]) => {
    if ((videos.data?.length ?? 0) + files.length > MAX_VIDEOS) return toast.error(`You can add up to ${MAX_VIDEOS} videos.`)
    await queue.run(files, (f, p) => uploadVideo(w, f, { title: files.length === 1 ? title : f.name.replace(/\.[^.]+$/, ''), description }, p), 1)
    setTitle('')
    setDescription('')
    await invalidate()
    await refresh()
  }
  const patch = useMutation({ mutationFn: ({ id, ...p }: { id: string; title?: string | null; description?: string | null }) => updateVideo(id, p), onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  const remove = useMutation({ mutationFn: (v: VideoItem) => deleteVideo(v), onSuccess: async () => (await invalidate(), await refresh(), toast.success('Video removed')), onError: (e) => toast.error(e.message) })
  const shift = async (i: number, d: number) => {
    const ids = videos.data!.map((v) => v.id)
    ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
    await reorder('wedding_videos', ids).catch((e: Error) => toast.error(e.message))
    await invalidate()
  }

  return (
    <StepFrame title="Pre-wedding videos" description="Guests only download a video when they press play, so adding one never slows the invitation down." continueLabel="Continue">
      <Panel>
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <Field label="Title" optional>{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Our pre-wedding film" />}</Field>
          <Field label="Description" optional>{(id) => <Input id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} placeholder="Shot in Coorg, monsoon 2026" />}</Field>
        </div>
        <Dropzone
          accept="video/mp4,video/webm"
          multiple
          onFiles={(f) => void upload(f)}
          title="Drop a video here"
          hint="MP4 (H.264) or WebM, up to 150 MB. For the fastest playback, export at 1080p or 720p — most phones play these smoothly on 4G."
        />
        <UploadQueue jobs={queue.jobs} />
      </Panel>
      <div className="mt-8 space-y-4">
        {videos.isLoading && <Skeleton className="h-40" />}
        {videos.data?.length === 0 && <EmptyState title="No videos yet" body="Optional — the video section is hidden until you add one." />}
        {videos.data?.map((v, i) => (
          <Panel key={v.id}>
            <div className="grid gap-5 md:grid-cols-[320px_1fr]">
              <video src={v.url} poster={v.posterUrl} controls preload="none" playsInline className="aspect-video w-full rounded-xl bg-black" />
              <div className="space-y-3">
                <Field label="Title">{(id) => <Input id={id} defaultValue={v.title ?? ''} maxLength={120} onBlur={(e) => e.target.value !== (v.title ?? '') && patch.mutate({ id: v.id, title: e.target.value.trim() || null })} />}</Field>
                <Field label="Description">{(id) => <Textarea id={id} rows={2} defaultValue={v.description ?? ''} maxLength={600} onBlur={(e) => e.target.value !== (v.description ?? '') && patch.mutate({ id: v.id, description: e.target.value.trim() || null })} />}</Field>
                <div className="flex items-center gap-2 text-sm text-mist">
                  <span>{formatBytes(v.size_bytes)}{v.duration_s ? ` — ${Math.round(v.duration_s)}s` : ''}</span>
                  <button type="button" disabled={i === 0} onClick={() => void shift(i, -1)} className="ml-auto grid size-9 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move up">
                    <ChevronUp className="size-4" />
                  </button>
                  <button type="button" disabled={i === videos.data!.length - 1} onClick={() => void shift(i, 1)} className="grid size-9 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move down">
                    <ChevronDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove.mutate(v)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete video">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </StepFrame>
  )
}
