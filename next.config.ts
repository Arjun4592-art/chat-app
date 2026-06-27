import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['nodemailer', 'firebase-admin'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
}

export default nextConfig
