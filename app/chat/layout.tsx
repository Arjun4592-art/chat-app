import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthProvider'
import ChatShell from '@/components/chat/chatShell'

export const metadata: Metadata = {
  title: 'ChatSpace',
  robots: { index: false, follow: false },
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ChatShell>{children}</ChatShell>
    </AuthProvider>
  )
}
