import type { ReactNode } from 'react'

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/demo/photos/bride-gold.webp" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/90 via-plum/20 to-transparent" />
        <p className="absolute right-10 bottom-10 left-10 font-display text-4xl leading-tight text-paper">“The invitation everyone in the family group forwarded twice.”</p>
      </div>
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-mist">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-mist">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
