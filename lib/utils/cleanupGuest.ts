import { getDoc } from 'firebase/firestore'
import { userDoc } from '@/lib/firebase/refs'
import { now } from './helper'
import type { User } from '@/types'

/**
 * Check if a specific guest's deleteAt has passed.
 * Returns true if expired (server will handle actual deletion).
 */
export async function checkAndDeleteExpiredGuest(
  uid: string,
): Promise<boolean> {
  try {
    const snap = await getDoc(userDoc(uid))
    if (!snap.exists()) return true
    const data = snap.data() as User
    if (data.type !== 'guest') return false
    if (!data.deleteAt) return false
    if (data.deleteAt > now()) return false
    return true
  } catch {
    return false
  }
}

/**
 * Trigger server-side cleanup of all expired guests.
 * No client-side Firestore deletes — avoids permission errors.
 */
export async function cleanupAllExpiredGuests(): Promise<void> {
  try {
    await fetch('/api/guest/cleanup', { method: 'POST' })
  } catch {
    // silent fail
  }
}
