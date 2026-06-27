import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { uid, deleteAt } = await req.json()
    if (!uid || !deleteAt) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing fields.' },
        { status: 400 },
      )
    }
    // Store scheduled delete record — a cron job or Cloud Function will pick this up
    await adminDb
      .collection('scheduledDeletes')
      .doc(uid)
      .set({ uid, deleteAt, type: 'guest' })
    return NextResponse.json<ApiResponse>({ success: true })
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed.' },
      { status: 500 },
    )
  }
}
