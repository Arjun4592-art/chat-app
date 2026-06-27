'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'
import { useChat } from '@/lib/hooks/useChat'
import ChatTopbar from '@/components/chat/ChatTopbar'
import ChatWindow from '@/components/chat/ChatWindow'
import GroupInfoPanel from '@/components/chat/GroupInfoPanel'
import { useState } from 'react'

interface DynamicChatViewProps {
  chatId: string
}

export default function DynamicChatView({ chatId }: DynamicChatViewProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { chat, otherUser, loading } = useChat(chatId, user?.uid ?? '')
  const [infoOpen, setInfoOpen] = useState(false)

  // Access control — redirect if not a member
  useEffect(() => {
    if (!loading && user && chat && !chat.members.includes(user.uid)) {
      router.replace('/chat')
    }
    if (!loading && !chat) {
      router.replace('/chat')
    }
  }, [loading, chat, user, router])

  if (loading || !chat || !user) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div
          className='w-8 h-8 rounded-full border-2 animate-spin'
          style={{
            borderColor: 'var(--color-primary-muted)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
      </div>
    )
  }

  return (
    <div className='flex h-full'>
      {/* Chat area */}
      <div className='flex flex-col flex-1 min-w-0'>
        <ChatTopbar
          chat={chat}
          otherUser={otherUser}
          onInfoOpen={() => setInfoOpen(true)}
        />
        <ChatWindow chat={chat} />
      </div>

      {/* Group info panel — right side, only on lg+ */}
      {infoOpen && chat.type === 'group' && (
        <GroupInfoPanel
          chat={chat}
          currentUid={user.uid}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </div>
  )
}
