'use client'

import { useEffect, useState } from 'react'
import { updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { chatDoc, GLOBAL_CHAT_ID } from '@/lib/firebase/refs'
import { useAuth } from '@/context/AuthProvider'
import ChatTopbar from '@/components/chat/ChatTopbar'
import ChatWindow from '@/components/chat/ChatWindow'
import { now } from '@/lib/utils/helper'
import type { Chat } from '@/types'

export default function GlobalChatView() {
  const { user } = useAuth()
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initGlobal() {
      if (!user) return

      const ref = chatDoc(GLOBAL_CHAT_ID)

      try {
        // First add user to members (this works even if they're already in it)
        await updateDoc(ref, {
          members: arrayUnion(user.uid),
        })

        // Now read the doc (user is a member so permission granted)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Chat
          setChat(data)
        }
      } catch (err) {
        console.error('GlobalChatView error:', err)
      } finally {
        setLoading(false)
      }
    }

    initGlobal()
  }, [user])

  if (loading || !chat) {
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
    <div className='flex flex-col h-full'>
      <ChatTopbar chat={chat} otherUser={null} />
      <ChatWindow chat={chat} />
    </div>
  )
}
