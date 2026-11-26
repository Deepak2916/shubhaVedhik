import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pause, Play, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Select, Switch } from '@/components/ui/Field'
import { Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { Dropzone, UploadQueue, useUploadQueue } from '@/features/media/Dropzone'
import { cn } from '@/lib/cn'
import { chooseLibraryTrack, clearActiveAudio, deleteAudio, listAudio, listLibraryTracks, setActiveAudio, updateWedding, uploadAudio, type AudioItem } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

function usePreviewPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  useEffect(() => () => audio.current?.pause(), [])
  const toggle = (url: string) => {
    if (playing === url) {
      audio.current?.pause()
      return setPlaying(null)
    }
    audio.current?.pause()
    audio.current = new Audio(url)
    audio.current.volume = 0.7
    audio.current.onended = () => setPlaying(null)
    void audio.current.play().then(() => setPlaying(url), () => setPlaying(null))
  }
  return { playing, toggle }
}

export default function MusicStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const qc = useQueryClient()
  const key = ['audio', w.id]
  const mine = useQuery({ queryKey: key, queryFn: () => listAudio(w.id) })
  const library = useQuery({ queryKey: ['library-tracks'], queryFn: listLibraryTracks, staleTime: 10 * 60_000 })
  const player = usePreviewPlayer()
  const queue = useUploadQueue()
  const [settings, setSettings] = useState({ enabled: true, volume: 0.6, autoplay: true, startOn: 'open' as 'open' | 'manual', ...w.music_settings })
  const setEnabled = async (enabled: boolean) => {
    const next = { ...settings, enabled }
    setSettings(next)
    await updateWedding(w.id, { music_settings: next })
  }
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: key })
    await refresh()
  }
  const active = mine.data?.find((a) => a.is_active)

  const pickLibrary = useMutation({ mutationFn: async (t: { id: string; title: string | null }) => (await chooseLibraryTrack(w.id, t.id, t.title), await setEnabled(true)), onSuccess: async () => (await invalidate(), toast.success('Music selected')), onError: (e) => toast.error(e.message) })
  const pickMine = useMutation({ mutationFn: async (a: AudioItem) => (await setActiveAudio(w.id, a.id), await setEnabled(true)), onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  const none = useMutation({ mutationFn: async () => (await clearActiveAudio(w.id), await setEnabled(false)), onSuccess: async () => (await invalidate(), toast.success('Music turned off')), onError: (e) => toast.error(e.message) })
  const remove = useMutation({ mutationFn: (a: AudioItem) => deleteAudio(a), onSuccess: invalidate, onError: (e) => toast.error(e.message) })

  const save = async () => {
    try {
      await updateWedding(w.id, { music_settings: settings })
      await refresh()
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  const row = (key: string, title: string, sub: string | null, url: string | undefined, selected: boolean, onPick: () => void, extra?: React.ReactNode) => (
    <li key={key} className={cn('flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1', selected ? 'ring-2 ring-kumkum' : 'ring-rose/70')}>
      <button type="button" disabled={!url} onClick={() => url && player.toggle(url)} className="grid size-11 shrink-0 place-items-center rounded-full bg-blush text-kumkum" aria-label={player.playing === url ? `Pause ${title}` : `Play ${title}`}>
        {player.playing === url ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        {sub && <p className="truncate text-sm text-mist">{sub}</p>}
      </div>
      {extra}
      <Button size="sm" variant={selected ? 'secondary' : 'primary'} onClick={onPick} disabled={selected} icon={selected ? <Check className="size-4" aria-hidden /> : undefined}>
        {selected ? 'Playing' : 'Use'}
      </Button>
    </li>
  )

  return (
    <StepFrame title="Background music" description="Music starts when a guest taps to open the invitation — browsers don’t allow sound before that. Guests can always pause or mute it." onContinue={save}>
      <div className="space-y-6">
        <Panel title="From our library" description="Royalty-free tracks you can use without worrying about rights.">
          {library.isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <ul className="space-y-2">
              {library.data?.map((t) => row(t.id, t.title ?? 'Untitled', t.description, t.url, active?.library_media_id === t.id, () => pickLibrary.mutate({ id: t.id, title: t.title })))}
            </ul>
          )}
        </Panel>
        <Panel title="Your own music" description="MP3, M4A, OGG or WAV up to 20 MB. Only upload music you have the right to use.">
          <Dropzone accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav" onFiles={(f) => void queue.run(f.slice(0, 1), (file, p) => uploadAudio(w, file, p)).then(() => setEnabled(true)).then(invalidate)} title="Drop a song here" hint="It will be selected automatically." />
          <UploadQueue jobs={queue.jobs} />
          <ul className="mt-4 space-y-2">
            {mine.data
              ?.filter((a) => a.storage_path)
              .map((a) =>
                row(a.id, a.title ?? 'Your track', 'Uploaded', a.url, a.is_active, () => pickMine.mutate(a), (
                  <button type="button" onClick={() => remove.mutate(a)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete track">
                    <Trash2 className="size-4" />
                  </button>
                )),
              )}
          </ul>
        </Panel>
        <Panel title="Playback">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={`Starting volume: ${Math.round(settings.volume * 100)}%`}>
              {(id) => <input id={id} type="range" min={0.1} max={1} step={0.05} value={settings.volume} onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })} className="range-thin w-full text-kumkum" />}
            </Field>
            <Field label="When should music start?">
              {(id) => (
                <Select id={id} value={settings.startOn} onChange={(e) => setSettings({ ...settings, startOn: e.target.value as 'open' | 'manual' })}>
                  <option value="open">When the guest opens the invitation</option>
                  <option value="manual">Only when the guest presses play</option>
                </Select>
              )}
            </Field>
            <Switch checked={settings.autoplay} onChange={(v) => setSettings({ ...settings, autoplay: v })} label="Play music automatically" description="Turn off to show a play button only." />
          </div>
          {settings.enabled ? (
            <Button className="mt-6" variant="ghost" size="sm" onClick={() => none.mutate()} loading={none.isPending}>
              Turn music off
            </Button>
          ) : (
            <p className="mt-6 text-sm text-mist">Music is off. Choose a track above to turn it back on.</p>
          )}
          {settings.enabled && !active && <p className="mt-3 text-sm text-mist">No track chosen yet — the design’s own track will play.</p>}
        </Panel>
      </div>
    </StepFrame>
  )
}
