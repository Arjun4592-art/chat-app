import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import { GUEST_DELETE_DELAY_MS } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { uid, isGuest } = await req.json()
    if (!uid) return NextResponse.json({ success: false }, { status: 400 })

    const nowMs = Date.now()
    const updates: Record<string, unknown> = {
      online: false,
      lastSeen: nowMs,
    }

    if (isGuest) {
      updates.logoutAt = nowMs
      updates.deleteAt = nowMs + GUEST_DELETE_DELAY_MS
    }

    await adminDb.collection('users').doc(uid).update(updates)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
