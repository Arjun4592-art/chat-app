'use client'

import { useEffect, useState } from 'react'
import { query, where, orderBy, onSnapshot, getDoc } from 'firebase/firestore'
import { chatsCol, userDoc, GLOBAL_CHAT_ID } from '@/lib/firebase/refs'
import type { Chat, ChatPreview, User } from '@/types'

export function useChatList(uid: string) {
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    const q = query(
      chatsCol,
      where('members', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
    )

    const unsub = onSnapshot(q, async (snap) => {
      const previews: ChatPreview[] = await Promise.all(
        snap.docs.map(async (d) => {
          const chat = { id: d.id, ...d.data() } as Chat
          // Unread = unreadCount map value for this user, or 0
          const unread = chat.unreadCount?.[uid] ?? 0
          let otherUser: User | null = null

          if (chat.type === 'dm') {
            const otherUid = chat.members.find((m) => m !== uid)
            if (otherUid) {
              const uSnap = await getDoc(userDoc(otherUid))
              if (uSnap.exists()) otherUser = uSnap.data() as User
            }
          }

          return { ...chat, unread, otherUser }
        }),
      )

      // Sort: global first, then by lastMessageAt
      previews.sort((a, b) => {
        if (a.id === GLOBAL_CHAT_ID) return -1
        if (b.id === GLOBAL_CHAT_ID) return 1
        return (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
      })

      setChats(previews)
      setLoading(false)
    })

    return () => unsub()
  }, [uid])

  return { chats, loading }
}
