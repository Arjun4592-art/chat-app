'use client'

import { useEffect, useState } from 'react'
import { query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { messagesCol } from '@/lib/firebase/refs'
import type { Message } from '@/types'

export function useMessages(chatId: string, msgLimit = 60) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatId) return
    const q = query(
      messagesCol(chatId),
      orderBy('createdAt', 'asc'),
      limit(msgLimit),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data() as Omit<Message, 'id'>
          return { ...data, id: d.id }
        }),
      )
      setLoading(false)
    })
    return () => unsub()
  }, [chatId, msgLimit])

  return { messages, loading }
}
