import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// ANALYZE=1 npx vite build  → one chunk per npm package, to inspect bundle composition.
const analyze = process.env.ANALYZE === '1'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: analyze
      ? {
          output: {
            manualChunks(id: string) {
              const m = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
              return m ? `v_${m[1].replace('/', '_')}` : undefined
            },
          },
        }
      : {
          output: {
            // Long-lived vendor chunks: app deploys don't invalidate these.
            manualChunks(id: string) {
              if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'vendor-react'
              if (/node_modules\/@supabase\//.test(id)) return 'vendor-supabase'
              return undefined
            },
          },
        },
  },
})
