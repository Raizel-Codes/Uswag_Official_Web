import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OG_IMAGE = '/images/og-card.png';

// Link-preview crawlers (Facebook, Messenger) don't run JS and need absolute URLs, so og:url and
// og:image are written into index.html at build time. Without VITE_SITE_URL they're left out
// rather than guessed; the text tags in index.html still work.
function openGraphUrls(siteUrl: string | undefined): Plugin {
  return {
    name: 'uswag-open-graph-urls',
    transformIndexHtml() {
      if (!siteUrl) return [];
      const base = siteUrl.replace(/\/+$/, '');
      return [
        { tag: 'meta', attrs: { property: 'og:url', content: `${base}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: `${base}${OG_IMAGE}` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        {
          tag: 'meta',
          attrs: { property: 'og:image:alt', content: 'The USWAG crest beside the words: USWAG, United Students Working for Advocacy and Growth. Est. 2010, reborn 2025.' },
          injectTo: 'head',
        },
      ];
    },
  };
}

// USWAG PWA build config.
// Manifest theme/background colors must match the design tokens in
// src/styles/tokens.css — do not diverge from the palette documented
// in /docs and /claude.md.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    openGraphUrls(loadEnv(mode, __dirname, 'VITE_').VITE_SITE_URL),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'USWAG — United Students Working for Advocacy and Growth',
        short_name: 'USWAG',
        description: 'Official website and member app for USWAG at Northwest Samar State University.',
        theme_color: '#142718',
        background_color: '#E7EFE4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Only link-preview crawlers fetch the share card; don't precache it for every visitor.
        globIgnores: [`**${OG_IMAGE}`],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/api\/scan/,
            handler: 'NetworkOnly', // Scan verification must require a live network call
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
}));
