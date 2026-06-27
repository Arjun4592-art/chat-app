'use client'

import { useEffect, useState } from 'react'
import { onSnapshot, getDoc } from 'firebase/firestore'
import { chatDoc, userDoc } from '@/lib/firebase/refs'
import type { Chat, User } from '@/types'

export function useChat(chatId: string, currentUid: string) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [otherUser, setOther] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatId) return
    const unsub = onSnapshot(chatDoc(chatId), async (snap) => {
      if (!snap.exists()) {
        setChat(null)
        setLoading(false)
        return
      }
      const data = { ...snap.data(), id: snap.id } as Chat
      setChat(data)

      if (data.type === 'dm') {
        const otherUid = data.members.find((m) => m !== currentUid)
        if (otherUid) {
          const uSnap = await getDoc(userDoc(otherUid))
          if (uSnap.exists()) setOther(uSnap.data() as User)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [chatId, currentUid])

  return { chat, otherUser, loading }
}
