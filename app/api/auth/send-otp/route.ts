import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/firebase-admin'
import { generateOtp, sendOtpEmail } from '@/lib/utils/mailer'
import { hashOtp, now } from '@/lib/utils/helper'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email is required.' },
        { status: 400 },
      )

    const otp = generateOtp()
    const hashed = await hashOtp(otp)
    const expiresAt = now() + 10 * 60 * 1000 // 10 minutes

    // Store in Firestore — overwrite any existing OTP for this email
    await adminDb.collection('otpCodes').doc(email).set({
      email,
      otp: hashed,
      expiresAt,
      attempts: 0,
    })

    // Send email
    await sendOtpEmail(email, otp, name)

    return NextResponse.json<ApiResponse>({ success: true })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to send OTP.' },
      { status: 500 },
    )
  }
}
