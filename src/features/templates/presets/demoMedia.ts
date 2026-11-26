import type { InvitationPhoto, PhotoKind } from '../../../lib/validation/invitation.ts'

/** Bundled demo photography (Unsplash License), optimised to WebP in public/demo/photos. */
const DIMS: Record<string, [number, number]> = {
  'attire-flowers': [1067, 1600], 'avenue-walk': [1600, 1067], 'bangles-watch': [1600, 1067],
  'beach-walk': [1600, 1067], 'blue-windows': [1600, 1067], 'bride-gold': [1067, 1600],
  'bride-portrait': [1068, 1600], 'bride-red': [1067, 1600], 'bride-silk': [1067, 1600],
  'bride-smile': [1067, 1600], 'bride-staircase': [1067, 1600], 'bride-twirl': [1600, 1067],
  'bride-veil-amber': [1067, 1600], 'church-altar': [1067, 1600], 'church-kiss': [1600, 1067],
  'church-vows': [1280, 1600], 'couple-classic': [1067, 1600], 'couple-garden-1': [1067, 1600],
  'couple-garden-2': [1067, 1600], 'couple-path-2': [1046, 1600], 'couple-path-red': [1067, 1600],
  'couple-regal': [1067, 1600], 'fairy-lights': [1067, 1600], 'field-white': [1067, 1600],
  'forest-lean': [1067, 1600], 'hall-ritual': [1600, 1067], 'hands-shadow': [1600, 1067],
  'henna-hands': [1600, 1067], 'hills-walk': [1600, 1067], 'mandap-day': [1600, 1067],
  'mandap-outdoor': [1600, 1041], 'mehndi-circle': [1600, 1067], 'mono-flowers': [1067, 1600],
  'nikah-lattice': [1600, 1067], 'palms-embrace': [1600, 1067], 'reception-canopy': [1600, 1067],
  'red-sky': [1600, 1068], 'rings-bible': [1600, 1067], 'river-couple': [1068, 1600],
  'sea-minimal': [1600, 1067], 'silk-henna': [1600, 1067], valley: [1067, 1600],
}

export type DemoPhotoName = keyof typeof DIMS

export const demoUrl = (name: string) => `/demo/photos/${name}.webp`
export const demoThumb = (name: string) => `/demo/photos/${name}-sm.webp`

export function demoPhoto(name: string, kind: PhotoKind, caption?: string): InvitationPhoto {
  const d = DIMS[name] ?? [1600, 1067]
  return {
    id: `demo-${name}`,
    kind,
    url: demoUrl(name),
    thumbUrl: demoThumb(name),
    width: d[0],
    height: d[1],
    caption: caption ?? null,
  }
}

export const DEMO_TRACKS = {
  tanpura: { url: '/demo/audio/tanpura-dawn.mp3', title: 'Tanpura Dawn' },
  mohanam: { url: '/demo/audio/mohanam-strings.mp3', title: 'Mohanam Strings' },
  harp: { url: '/demo/audio/harp-serenade.mp3', title: 'Harp Serenade' },
} as const

export const DEMO_VIDEO = {
  url: '/demo/video/our-story.mp4',
  posterUrl: '/demo/video/our-story-poster.webp',
}
