import type { Metadata } from 'next'
import GlobalChatView from '@/components/chat/GlobalChatView'

export const metadata: Metadata = {
  title: 'Global Room | ChatSpace',
  robots: { index: false, follow: false },
}

export default function ChatPage() {
  return <GlobalChatView />
}
