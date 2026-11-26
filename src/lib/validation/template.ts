import { z } from 'zod'

/**
 * Template configuration contract.
 * A template *version* stores `TemplateConfig` (JSONB) and owns an ordered list
 * of sections, each with a `SectionConfig`. The database validates the critical
 * subset (see is_valid_template_config in 0001_schema.sql); this schema validates
 * the whole shape in the admin builder and when rendering.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like #A1B2C3')

export const FONT_KEYS = [
  'rozha', 'mukta', 'marcellus', 'cinzel', 'cormorant', 'cormorant-sc', 'gilda', 'amiri', 'aref-ruqaa',
  'pinyon', 'eb-garamond', 'italiana', 'jost', 'yatra', 'hind', 'antonio', 'libre-caslon', 'great-vibes',
  'playfair', 'tiro-telugu', 'tiro-devanagari', 'tiro-tamil', 'tiro-kannada', 'tiro-bangla', 'tiro-gurmukhi',
  'noto-serif-malayalam', 'noto-serif-gujarati', 'noto-nastaliq-urdu',
] as const
export const fontKeySchema = z.enum(FONT_KEYS)

export const MOTIFS = ['temple', 'geometric', 'floral', 'editorial', 'festive', 'film'] as const
export const OPENING_STYLES = ['temple-doors', 'mihrab', 'envelope', 'curtain', 'film-leader', 'editorial-split'] as const
export const ANIMATION_PRESETS = ['gentle', 'royal', 'cinematic', 'minimal'] as const
export const REVEALS = ['fade', 'rise', 'clip', 'zoom', 'none'] as const

export const SECTION_TYPES = [
  'hero', 'invitation', 'couple', 'bride', 'groom', 'family', 'countdown', 'message',
  'story', 'gallery', 'videos', 'events', 'venue', 'map', 'closing',
] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export const MESSAGE_KINDS = ['invitation', 'story', 'family', 'welcome', 'custom', 'blessings', 'thankyou'] as const
export type MessageKind = (typeof MESSAGE_KINDS)[number]

export const paletteSchema = z.object({
  background: hex,
  surface: hex,
  text: hex,
  muted: hex,
  primary: hex,
  accent: hex,
  onPrimary: hex.optional(),
  border: hex.optional(),
})

export const themeSchema = z.object({
  palette: paletteSchema,
  fonts: z.object({
    display: fontKeySchema,
    body: fontKeySchema,
    script: fontKeySchema.optional(),
    accent: fontKeySchema.optional(),
  }),
  motif: z.enum(MOTIFS),
  texture: z.enum(['none', 'paper', 'silk', 'grain', 'linen']).default('none'),
  radius: z.enum(['none', 'soft', 'round', 'arch']).default('soft'),
  ornament: z.number().min(0).max(1).default(0.7),
  headingCase: z.enum(['normal', 'upper']).default('normal'),
})

export const openingSchema = z.object({
  style: z.enum(OPENING_STYLES),
  eyebrow: z.string().max(120).default(''),
  title: z.string().max(120).default('You are invited'),
  buttonLabel: z.string().min(1).max(40).default('Open invitation'),
  backgroundImage: z.string().max(500).optional(),
  showDate: z.boolean().default(true),
})

export const animationSchema = z.object({
  preset: z.enum(ANIMATION_PRESETS),
  reveal: z.enum(REVEALS).default('rise'),
  duration: z.number().min(0.2).max(2).default(0.9),
  stagger: z.number().min(0).max(0.5).default(0.08),
  ambient: z.boolean().default(true),
})

export const musicSchema = z.object({
  enabled: z.boolean().default(true),
  defaultTrackUrl: z.string().max(500).optional(),
  defaultTrackTitle: z.string().max(120).optional(),
  volume: z.number().min(0).max(1).default(0.6),
})

export const templateConfigSchema = z.object({
  schemaVersion: z.literal(1),
  theme: themeSchema,
  opening: openingSchema,
  animation: animationSchema,
  music: musicSchema,
  customizable: z.object({ palette: z.boolean().default(true) }).default({ palette: true }),
})
export type TemplateConfig = z.infer<typeof templateConfigSchema>
export type TemplateConfigInput = z.input<typeof templateConfigSchema>
export type Palette = z.infer<typeof paletteSchema>
export type ThemeConfig = z.infer<typeof themeSchema>

export const sectionConfigSchema = z.object({
  variant: z.string().max(40).optional(),
  eyebrow: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  body: z.string().max(2000).optional(),
  background: z.enum(['base', 'surface', 'primary', 'image']).optional(),
  backgroundImage: z.string().max(500).optional(),
  overlay: z.number().min(0).max(1).optional(),
  align: z.enum(['left', 'center']).optional(),
  reveal: z.enum([...REVEALS, 'inherit']).optional(),
  ornament: z.boolean().optional(),
  messageKind: z.enum(MESSAGE_KINDS).optional(),
  spacing: z.enum(['compact', 'normal', 'airy']).optional(),
  limit: z.number().int().min(1).max(60).optional(),
})
export type SectionConfig = z.infer<typeof sectionConfigSchema>

export const sectionDefSchema = z.object({
  key: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  type: z.enum(SECTION_TYPES),
  enabled: z.boolean(),
  position: z.number().int().optional(),
  config: sectionConfigSchema,
})
export type SectionDef = z.infer<typeof sectionDefSchema>

/** Layout variants each section component understands (admin builder dropdowns). */
export const SECTION_VARIANTS: Record<SectionType, readonly string[]> = {
  hero: ['temple-arch', 'mihrab-frame', 'wreath', 'editorial-split', 'garland-banner', 'fullbleed-letterbox'],
  invitation: ['scroll-card', 'centered-ornate', 'order-of-service', 'statement', 'ganesha-card', 'title-card'],
  couple: ['arch-portraits', 'side-by-side', 'editorial-columns', 'circle-portraits', 'credits'],
  bride: ['portrait-left', 'portrait-full'],
  groom: ['portrait-right', 'portrait-full'],
  family: ['two-column', 'centered'],
  countdown: ['framed', 'numerals', 'flip'],
  message: ['centered', 'quote', 'letter'],
  story: ['timeline', 'chapters'],
  gallery: ['masonry', 'arched-grid', 'editorial-grid', 'polaroid', 'filmstrip'],
  videos: ['framed', 'cinema'],
  events: ['pillar-timeline', 'arch-cards', 'programme', 'table', 'tickets', 'call-sheet'],
  venue: ['framed', 'minimal', 'location-card'],
  map: ['embed'],
  closing: ['blessing', 'dua', 'verse', 'monogram', 'rangoli', 'end-credits'],
}

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Invitation cover',
  invitation: 'Invitation message',
  couple: 'Couple introduction',
  bride: 'Bride',
  groom: 'Groom',
  family: 'Families',
  countdown: 'Countdown',
  message: 'Custom message',
  story: 'Love story',
  gallery: 'Photo gallery',
  videos: 'Pre-wedding videos',
  events: 'Event schedule',
  venue: 'Venue',
  map: 'Map',
  closing: 'Closing message',
}

export function parseTemplateConfig(value: unknown): TemplateConfig {
  return templateConfigSchema.parse(value)
}
