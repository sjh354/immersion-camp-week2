import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '억빠를 부탁해',
    short_name: '억빠',
    description: '무조건 편들어주고 억지로라도 응원해주는 재미있는 서비스',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffcc00',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}