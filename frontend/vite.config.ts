/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'PizzaShop — Pizzaria Callidus',
        short_name: 'PizzaShop',
        description: 'Peça sua pizza online',
        theme_color: '#C0392B',
        background_color: '#FDF8F0',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // Cacheia cardápio e config para funcionar offline
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes('/pizzas') ||
              url.pathname.includes('/config') ||
              url.pathname.includes('/categorias') ||
              url.pathname.includes('/promocoes'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cardapio-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
    server: {
    host: true,
    port: 5173,
    allowedHosts: ['.trycloudflare.com']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})