import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import type { ApiResponse } from '@/types'

export async function POST() {
  try {
    const now = Date.now()
    const snapshot = await adminDb
      .collection('users')
      .where('type', '==', 'guest')
      .where('deleteAt', '<=', now)
      .get()

    if (snapshot.empty) {
      return NextResponse.json<ApiResponse>({ success: true })
    }

    for (const userDoc of snapshot.docs) {
      const uid = userDoc.id
      try {
        // Find all chats where guest is member
        const chatsSnap = await adminDb
          .collection('chats')
          .where('members', 'array-contains', uid)
          .get()

        for (const chatDoc of chatsSnap.docs) {
          const chatId = chatDoc.id

          // Delete messages in batches
          let hasMore = true
          while (hasMore) {
            const msgsSnap = await adminDb
              .collection('chats')
              .doc(chatId)
              .collection('messages')
              .where('senderId', '==', uid)
              .limit(500)
              .get()

            if (msgsSnap.empty) {
              hasMore = false
              break
            }
            const batch = adminDb.batch()
            msgsSnap.docs.forEach((d) => batch.delete(d.ref))
            await batch.commit()
            if (msgsSnap.docs.length < 500) hasMore = false
          }

          // Remove from members array (skip global)
          if (chatId !== 'global') {
            const members = (chatDoc.data().members as string[]).filter(
              (m) => m !== uid,
            )
            await chatDoc.ref.update({ members })
          }
        }

        // Delete user doc
        await userDoc.ref.delete()
        await adminDb
          .collection('scheduledDeletes')
          .doc(uid)
          .delete()
          .catch(() => {})
      } catch (err) {
        console.warn(`[cleanup] failed for ${uid}:`, err)
      }
    }

    return NextResponse.json<ApiResponse>({ success: true })
  } catch (err) {
    console.error('[cleanup] error:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Cleanup failed' },
      { status: 500 },
    )
  }
}
