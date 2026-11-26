import type { CSSProperties } from 'react'
import { fontStack, LANGUAGE_FONTS, loadFonts } from '@/lib/fonts'
import type { Palette, TemplateConfig } from '@/lib/validation/template'

type FontKey = TemplateConfig['theme']['fonts']['display']

/** Resolves the effective palette: template palette + customer overrides (when the template allows it). */
export function resolvePalette(config: TemplateConfig, overrides?: Partial<Palette>): Palette {
  const base = config.theme.palette
  if (!config.customizable.palette || !overrides) return base
  const clean = Object.fromEntries(Object.entries(overrides).filter(([, v]) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)))
  return { ...base, ...clean }
}

/** Loads the template's fonts plus regional script fonts for the wedding's languages. */
export function prepareFonts(config: TemplateConfig, languages: string[]): FontKey[] {
  const regional = languages.map((l) => LANGUAGE_FONTS[l]).filter((k): k is FontKey => Boolean(k))
  if (config.theme.fonts.accent) regional.push(config.theme.fonts.accent)
  const { display, body, script, accent } = config.theme.fonts
  loadFonts([display, body, ...(script ? [script] : []), ...(accent ? [accent] : []), ...regional])
  return regional
}

export function themeStyle(config: TemplateConfig, palette: Palette, regional: FontKey[]): CSSProperties {
  const { fonts } = config.theme
  return {
    '--inv-bg': palette.background,
    '--inv-surface': palette.surface,
    '--inv-text': palette.text,
    '--inv-muted': palette.muted,
    '--inv-primary': palette.primary,
    '--inv-accent': palette.accent,
    '--inv-on-primary': palette.onPrimary ?? palette.background,
    '--inv-border': palette.border ?? palette.primary,
    '--inv-font-display': fontStack(fonts.display, regional),
    '--inv-font-body': fontStack(fonts.body, regional),
    '--inv-font-script': fontStack(fonts.script ?? fonts.display, regional),
    '--inv-font-accent': fontStack(fonts.accent ?? fonts.display, regional),
  } as CSSProperties
}

export function interpolate(text: string | null | undefined, vars: Record<string, string>): string {
  if (!text) return ''
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? '')
}
