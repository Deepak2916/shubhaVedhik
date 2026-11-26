import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion } from 'motion/react'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { router } from './router'

const loadMotionFeatures = () => import('./motionFeatures').then((m) => m.default)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </LazyMotion>
    </QueryClientProvider>
  )
}
