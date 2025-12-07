import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/SDVIG/';

export default defineConfig({
	base,
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
			manifest: {
				name: 'СДВиГ - Productivity для СДВГ',
				short_name: 'СДВиГ',
				description: 'Productivity-приложение для людей с СДВГ',
				theme_color: '#0F766E',
				background_color: '#FFFFFF',
				display: 'standalone',
				orientation: 'portrait',
				scope: base,
				start_url: base,
				id: base,
				icons: [
					{
						src: 'favicon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: 'favicon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable'
					},
					{
						src: 'favicon.svg',
						sizes: '112x112',
						type: 'image/svg+xml',
						purpose: 'maskable'
					},
					{
						src: 'favicon.svg',
						sizes: '112x112',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			},
		workbox: {
			globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
			maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			}
		})
	],
	server: {
		port: 3000
	}
});
