import type { Metadata } from 'next'
import DynamicChatView from '@/components/chat/DynamicChatView'

export const metadata: Metadata = {
  title: 'Chat | ChatSpace',
  robots: { index: false, follow: false },
}

export default async function ChatIdPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  return <DynamicChatView chatId={chatId} />
}
