import type { Metadata, Viewport } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'ChatSpace — Real-time Chat App',
    template: '%s | ChatSpace',
  },
  description:
    'ChatSpace is a fast, modern real-time chat app. Message anyone — one-on-one, in groups, or in the global room.',
  keywords: [
    'chat app',
    'real-time messaging',
    'group chat',
    'direct messages',
  ],
  authors: [{ name: 'ChatSpace' }],
  creator: 'ChatSpace',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ChatSpace',
    title: 'ChatSpace — Real-time Chat App',
    description:
      'Fast, modern real-time messaging. Global room, direct messages, and private groups.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChatSpace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChatSpace — Real-time Chat App',
    description:
      'Fast, modern real-time messaging. Global room, DMs, and private groups.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#12101a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}
