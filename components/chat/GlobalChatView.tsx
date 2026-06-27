'use client'

import { useEffect, useState } from 'react'
import { updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import { chatDoc, GLOBAL_CHAT_ID, messagesCol } from '@/lib/firebase/refs'
import { useAuth } from '@/context/AuthProvider'
import ChatTopbar from '@/components/chat/ChatTopbar'
import ChatWindow from '@/components/chat/ChatWindow'
import GlobalInfoPanel from '@/components/chat/GlobalInfoPanel'
import { now } from '@/lib/utils/helper'
import type { Chat } from '@/types'

// Auto-delete global messages older than 30 mins
const GLOBAL_MSG_TTL = 30 * 60 * 1000

export default function GlobalChatView() {
  const { user } = useAuth()
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initGlobal() {
      if (!user) return
      const ref = chatDoc(GLOBAL_CHAT_ID)
      try {
        await updateDoc(ref, { members: arrayUnion(user.uid) })
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setChat({ id: snap.id, ...snap.data() } as Chat)
        }
      } catch (err) {
        console.error('GlobalChatView error:', err)
      } finally {
        setLoading(false)
      }
    }
    initGlobal()
  }, [user])

  // Auto-delete messages older than 30 mins
  useEffect(() => {
    if (!chat) return

    async function deleteOldMessages() {
      const { getDocs, query, where, writeBatch, deleteDoc } =
        await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const cutoff = now() - GLOBAL_MSG_TTL
      const q = query(
        messagesCol(GLOBAL_CHAT_ID),
        where('createdAt', '<', cutoff),
      )
      const snap = await getDocs(q)
      if (snap.empty) return
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }

    deleteOldMessages().catch(() => {})
    // Run every 5 minutes
    const interval = setInterval(
      () => deleteOldMessages().catch(() => {}),
      5 * 60 * 1000,
    )
    return () => clearInterval(interval)
  }, [chat])

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
    <div className='flex h-full'>
      {/* Chat area */}
      <div className='flex flex-col flex-1 min-w-0'>
        <ChatTopbar chat={chat} otherUser={null} />
        <ChatWindow chat={chat} />
      </div>

      {/* Right panel — always visible */}
      <GlobalInfoPanel chatMembers={chat.members} />
    </div>
  )
}
