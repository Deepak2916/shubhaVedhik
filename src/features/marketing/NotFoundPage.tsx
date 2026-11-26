import { ButtonLink } from '@/components/ui/Button'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found · ShubhaVedhik', noindex: true })
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
      <p className="font-display text-7xl text-kumkum">404</p>
      <h1 className="mt-4 font-display text-3xl">This page wandered off the mandap</h1>
      <p className="mt-3 text-mist">The address may be mistyped. If you were opening a wedding invitation, check the link with whoever shared it.</p>
      <ButtonLink to="/" className="mt-8">
        Go to the home page
      </ButtonLink>
    </div>
  )
}
