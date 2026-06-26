'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

const OTP_LENGTH = 6

export default function OtpVerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const uid = params.get('uid') ?? ''

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCd, setResendCd] = useState(60) // cooldown seconds
  const [resending, setResending] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown
  useEffect(() => {
    if (resendCd <= 0) return
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCd])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
    const next = [...digits]
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  async function handleVerify() {
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) return setError('Please enter all 6 digits.')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, uid }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Invalid or expired code.')
        setLoading(false)
        return
      }

      // Mark verified in Firestore
      await updateDoc(doc(db, 'users', uid), { otpVerified: true })
      setSuccess(true)
      setTimeout(() => router.push('/chat'), 1000)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendCd(60)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (success) {
    return (
      <div
        className='flex flex-col items-center gap-3 py-14'
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          className='w-12 h-12 flex items-center justify-center'
          style={{
            background: 'var(--color-success-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M20 6L9 17L4 12'
              stroke='#16a34a'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <p
          className='font-heading font-semibold text-lg'
          style={{ color: 'var(--color-text-primary)' }}
        >
          Verified!
        </p>
        <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
          Redirecting you…
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Email hint */}
      <p
        className='text-sm text-center mb-6'
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Code sent to{' '}
        <span
          className='font-medium'
          style={{ color: 'var(--color-text-primary)' }}
        >
          {email}
        </span>
      </p>

      {/* Error */}
      {error && (
        <div
          role='alert'
          className='text-sm mb-5 px-4 py-3'
          style={{
            background: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #fca5a5',
          }}
        >
          {error}
        </div>
      )}

      {/* OTP boxes */}
      <div className='flex justify-center gap-2 mb-6' onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`OTP digit ${i + 1}`}
            className='text-center text-xl font-heading font-semibold outline-none transition-all'
            style={{
              width: '44px',
              height: '52px',
              background: 'var(--color-surface)',
              border: `2px solid ${d ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-heading)',
            }}
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading}
        className='w-full text-sm font-medium transition-all active:scale-[0.98]'
        style={{
          height: 'var(--input-height)',
          background: loading
            ? 'var(--color-primary-muted)'
            : 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Verifying…' : 'Verify email'}
      </button>

      {/* Resend */}
      <p
        className='text-center text-sm mt-5'
        style={{ color: 'var(--color-text-muted)' }}
      >
        Didn&apos;t get the code?{' '}
        {resendCd > 0 ? (
          <span style={{ color: 'var(--color-text-muted)' }}>
            Resend in {resendCd}s
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className='font-medium hover:underline'
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 'inherit',
            }}
          >
            {resending ? 'Sending…' : 'Resend'}
          </button>
        )}
      </p>
    </div>
  )
}
