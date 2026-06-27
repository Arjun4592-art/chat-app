import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
  deleteDoc,
  doc,
  updateDoc,
  arrayRemove,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { now } from './helper'

/**
 * Check if a specific guest's deleteAt has passed — if so, delete their data.
 * Called on auth state change when a guest logs back in.
 * Returns true if data was deleted (user should be treated as new).
 */
export async function checkAndDeleteExpiredGuest(
  uid: string,
): Promise<boolean> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid))
    if (!userSnap.exists()) return true // already deleted

    const userData = userSnap.data()

    // Not a guest — skip
    if (userData.type !== 'guest') return false

    // No deleteAt set — still active session
    if (!userData.deleteAt) return false

    // 30 min window still open — data intact
    if (userData.deleteAt > now()) return false

    // 30 min passed — delete everything
    await deleteGuestData(uid)
    return true
  } catch (err) {
    console.warn('[checkExpiredGuest] error:', err)
    return false
  }
}

/**
 * Delete all data for a guest user
 */
export async function deleteGuestData(uid: string): Promise<void> {
  try {
    // 1. Find all chats where guest is a member
    const chatsSnap = await getDocs(
      query(collection(db, 'chats'), where('members', 'array-contains', uid)),
    )

    for (const chatDoc of chatsSnap.docs) {
      const chatId = chatDoc.id

      // Delete messages sent by this guest (in batches of 500)
      let hasMore = true
      while (hasMore) {
        const msgsSnap = await getDocs(
          query(
            collection(db, 'chats', chatId, 'messages'),
            where('senderId', '==', uid),
            limit(500),
          ),
        )
        if (msgsSnap.empty) {
          hasMore = false
          break
        }
        const batch = writeBatch(db)
        msgsSnap.docs.forEach((d) => batch.delete(d.ref))
        await batch.commit()
        if (msgsSnap.docs.length < 500) hasMore = false
      }

      // Remove from members (skip global room)
      if (chatId !== 'global') {
        await updateDoc(chatDoc.ref, { members: arrayRemove(uid) })
      }
    }

    // 2. Delete user doc
    await deleteDoc(doc(db, 'users', uid))

    // 3. Delete scheduled delete record
    await deleteDoc(doc(db, 'scheduledDeletes', uid)).catch(() => {})
  } catch (err) {
    console.warn(`[deleteGuestData] failed for ${uid}:`, err)
  }
}

/**
 * Cleanup all expired guests — run on app start
 */
export async function cleanupAllExpiredGuests(): Promise<void> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'users'),
        where('type', '==', 'guest'),
        where('deleteAt', '<=', now()),
      ),
    )
    for (const d of snap.docs) {
      await deleteGuestData(d.id)
    }
  } catch (err) {
    console.warn('[cleanupAllExpiredGuests] error:', err)
  }
}
