import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import { now } from '@/lib/utils/helper'
import { GUEST_DELETE_DELAY_MS } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { uid, isGuest } = await req.json()
    if (!uid) return NextResponse.json({ success: false }, { status: 400 })

    const updates: Record<string, unknown> = { online: false, lastSeen: now() }

    if (isGuest) {
      updates.logoutAt = now()
      updates.deleteAt = now() + GUEST_DELETE_DELAY_MS
    }

    await adminDb.collection('users').doc(uid).update(updates)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
