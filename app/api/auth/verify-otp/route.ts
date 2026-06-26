import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import { verifyOtp, now } from '@/lib/utils/helper'
import type { ApiResponse, OtpRecord } from '@/types'

const MAX_ATTEMPTS = 3

export async function POST(req: NextRequest) {
  try {
    const { email, otp, uid } = await req.json()
    if (!email || !otp || !uid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing fields.' },
        { status: 400 },
      )
    }

    const ref = adminDb.collection('otpCodes').doc(email)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No OTP found. Please request a new one.' },
        { status: 400 },
      )
    }

    const record = snap.data() as OtpRecord

    // Expired?
    if (now() > record.expiresAt) {
      await ref.delete()
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Code has expired. Please request a new one.',
        },
        { status: 400 },
      )
    }

    // Too many attempts?
    if (record.attempts >= MAX_ATTEMPTS) {
      await ref.delete()
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Too many attempts. Please request a new code.',
        },
        { status: 400 },
      )
    }

    const valid = await verifyOtp(otp, record.otp)

    if (!valid) {
      await ref.update({ attempts: record.attempts + 1 })
      const left = MAX_ATTEMPTS - record.attempts - 1
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            left > 0
              ? `Incorrect code. ${left} attempt${left !== 1 ? 's' : ''} left.`
              : 'Too many attempts. Please request a new code.',
        },
        { status: 400 },
      )
    }

    // Valid — delete OTP record
    await ref.delete()

    // Update user otpVerified in Firestore
    await adminDb.collection('users').doc(uid).update({ otpVerified: true })

    return NextResponse.json<ApiResponse>({ success: true })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong.' },
      { status: 500 },
    )
  }
}
