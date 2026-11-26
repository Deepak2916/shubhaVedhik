import type { ThemeConfig } from './validation/template'

type FontKey = ThemeConfig['fonts']['display']

interface FontDef {
  family: string
  google: string
  fallback: 'serif' | 'sans-serif' | 'cursive'
}

export const FONTS: Record<FontKey, FontDef> = {
  rozha: { family: 'Rozha One', google: 'Rozha+One', fallback: 'serif' },
  mukta: { family: 'Mukta', google: 'Mukta:wght@400;500;600', fallback: 'sans-serif' },
  marcellus: { family: 'Marcellus', google: 'Marcellus', fallback: 'serif' },
  cinzel: { family: 'Cinzel', google: 'Cinzel:wght@400;600;700', fallback: 'serif' },
  cormorant: { family: 'Cormorant Garamond', google: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400', fallback: 'serif' },
  'cormorant-sc': { family: 'Cormorant SC', google: 'Cormorant+SC:wght@400;600', fallback: 'serif' },
  gilda: { family: 'Gilda Display', google: 'Gilda+Display', fallback: 'serif' },
  amiri: { family: 'Amiri', google: 'Amiri:wght@400;700', fallback: 'serif' },
  'aref-ruqaa': { family: 'Aref Ruqaa', google: 'Aref+Ruqaa', fallback: 'serif' },
  pinyon: { family: 'Pinyon Script', google: 'Pinyon+Script', fallback: 'cursive' },
  'eb-garamond': { family: 'EB Garamond', google: 'EB+Garamond:ital,wght@0,400;0,500;1,400', fallback: 'serif' },
  italiana: { family: 'Italiana', google: 'Italiana', fallback: 'serif' },
  jost: { family: 'Jost', google: 'Jost:wght@300;400;500', fallback: 'sans-serif' },
  yatra: { family: 'Yatra One', google: 'Yatra+One', fallback: 'serif' },
  hind: { family: 'Hind', google: 'Hind:wght@400;500;600', fallback: 'sans-serif' },
  antonio: { family: 'Antonio', google: 'Antonio:wght@300;500;700', fallback: 'sans-serif' },
  'libre-caslon': { family: 'Libre Caslon Text', google: 'Libre+Caslon+Text:ital,wght@0,400;1,400', fallback: 'serif' },
  'great-vibes': { family: 'Great Vibes', google: 'Great+Vibes', fallback: 'cursive' },
  playfair: { family: 'Playfair Display', google: 'Playfair+Display:ital,wght@0,400;0,600;1,400', fallback: 'serif' },
  'tiro-telugu': { family: 'Tiro Telugu', google: 'Tiro+Telugu', fallback: 'serif' },
  'tiro-devanagari': { family: 'Tiro Devanagari Hindi', google: 'Tiro+Devanagari+Hindi', fallback: 'serif' },
  'tiro-tamil': { family: 'Tiro Tamil', google: 'Tiro+Tamil', fallback: 'serif' },
  'tiro-kannada': { family: 'Tiro Kannada', google: 'Tiro+Kannada', fallback: 'serif' },
  'tiro-bangla': { family: 'Tiro Bangla', google: 'Tiro+Bangla', fallback: 'serif' },
  'tiro-gurmukhi': { family: 'Tiro Gurmukhi', google: 'Tiro+Gurmukhi', fallback: 'serif' },
  'noto-serif-malayalam': { family: 'Noto Serif Malayalam', google: 'Noto+Serif+Malayalam:wght@400;600', fallback: 'serif' },
  'noto-serif-gujarati': { family: 'Noto Serif Gujarati', google: 'Noto+Serif+Gujarati:wght@400;600', fallback: 'serif' },
  'noto-nastaliq-urdu': { family: 'Noto Nastaliq Urdu', google: 'Noto+Nastaliq+Urdu', fallback: 'serif' },
}

/** Regional script fonts, chosen per wedding language. */
export const LANGUAGE_FONTS: Record<string, FontKey> = {
  te: 'tiro-telugu',
  ta: 'tiro-tamil',
  kn: 'tiro-kannada',
  ml: 'noto-serif-malayalam',
  hi: 'tiro-devanagari',
  mr: 'tiro-devanagari',
  bn: 'tiro-bangla',
  gu: 'noto-serif-gujarati',
  pa: 'tiro-gurmukhi',
  ur: 'noto-nastaliq-urdu',
}

const loaded = new Set<string>()

/** Injects one Google Fonts stylesheet for the given keys (deduplicated, display=swap). */
export function loadFonts(keys: FontKey[]): void {
  const missing = [...new Set(keys)].filter((k) => !loaded.has(k) && FONTS[k])
  if (missing.length === 0) return
  missing.forEach((k) => loaded.add(k))
  const families = missing.map((k) => `family=${FONTS[k].google}`).join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}

/** CSS font-family stack: primary face, then regional faces for mixed-script text. */
export function fontStack(key: FontKey | undefined, regional: FontKey[] = []): string {
  if (!key) return 'inherit'
  const def = FONTS[key]
  const extra = regional.filter((r) => r !== key).map((r) => `'${FONTS[r].family}'`)
  return [`'${def.family}'`, ...extra, def.fallback].join(', ')
}
