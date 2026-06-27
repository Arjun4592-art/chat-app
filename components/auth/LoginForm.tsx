'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase/config'
import { getAvatarColor, now } from '@/lib/utils/helper'
import GuestInfoModal from '@/components/auth/GuestInfoModal'
import type { User } from '@/types'

type Step = 'form' | 'loading'

export default function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)

  const clearError = () => setError('')

  // ── Email / Password ───────────────────────────────────────────────────────

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    clearError()
    if (!email || !password) return setError('Please fill in all fields.')
    setStep('loading')
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists()) {
        setStep('form')
        return setError('Account not found. Please sign up.')
      }

      const userData = snap.data() as User
      if (!userData.otpVerified) {
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(email)}&uid=${cred.user.uid}`,
        )
        return
      }
      router.push('/chat')
    } catch (err: unknown) {
      setStep('form')
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential')
        setError('Incorrect email or password.')
      else if (code === 'auth/too-many-requests')
        setError('Too many attempts. Try again later.')
      else setError('Something went wrong. Please try again.')
    }
  }

  // ── Google ─────────────────────────────────────────────────────────────────

  async function handleGoogleLogin() {
    clearError()
    setStep('loading')
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const user = cred.user
      const snap = await getDoc(doc(db, 'users', user.uid))

      if (!snap.exists()) {
        const newUser: User = {
          uid: user.uid,
          name: user.displayName ?? 'User',
          email: user.email,
          photoURL: user.photoURL,
          type: 'registered',
          online: true,
          lastSeen: now(),
          createdAt: now(),
          otpVerified: false,
          avatarColor: getAvatarColor(user.uid),
        }
        await setDoc(doc(db, 'users', user.uid), newUser)
        await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.displayName }),
        })
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(user.email!)}&uid=${user.uid}`,
        )
        return
      }

      const userData = snap.data() as User
      if (!userData.otpVerified) {
        await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.displayName }),
        })
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(user.email!)}&uid=${user.uid}`,
        )
        return
      }
      router.push('/chat')
    } catch {
      setStep('form')
      setError('Google sign-in failed. Please try again.')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === 'loading') return <LoadingCard />

  return (
    <>
      <div
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
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

        {/* Email form */}
        <form onSubmit={handleEmailLogin} noValidate>
          <div className='mb-4'>
            <label
              htmlFor='email'
              className='block text-sm font-medium mb-1.5'
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              required
              className='w-full px-4 text-sm outline-none transition-all'
              style={{
                height: 'var(--input-height)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <div className='mb-6'>
            <label
              htmlFor='password'
              className='block text-sm font-medium mb-1.5'
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Password
            </label>
            <div className='relative'>
              <input
                id='password'
                type={showPass ? 'text' : 'password'}
                autoComplete='current-password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => {
                  setPass(e.target.value)
                  clearError()
                }}
                required
                className='w-full px-4 text-sm outline-none transition-all'
                style={{
                  height: 'var(--input-height)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  paddingRight: '44px',
                }}
              />
              <button
                type='button'
                onClick={() => setShowPass((p) => !p)}
                className='absolute right-3 top-1/2 -translate-y-1/2 icon-btn'
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div className='flex justify-end mt-1.5'>
              <Link
                href='/auth/forgot-password'
                className='text-xs hover:underline'
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type='submit'
            className='w-full text-sm font-medium transition-all active:scale-[0.98]'
            style={{
              height: 'var(--input-height)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className='flex items-center gap-3 my-5'>
          <div
            className='flex-1 h-px'
            style={{ background: 'var(--color-border)' }}
          />
          <span
            className='text-xs'
            style={{ color: 'var(--color-text-muted)' }}
          >
            or
          </span>
          <div
            className='flex-1 h-px'
            style={{ background: 'var(--color-border)' }}
          />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className='w-full flex items-center justify-center gap-2.5 text-sm font-medium transition-all active:scale-[0.98] mb-3'
          style={{
            height: 'var(--input-height)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Guest — opens modal */}
        <button
          onClick={() => setShowGuestModal(true)}
          className='w-full flex items-center justify-center gap-2.5 text-sm font-medium transition-all active:scale-[0.98]'
          style={{
            height: 'var(--input-height)',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary-muted)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          <GuestIcon />
          Continue as Guest
        </button>

        <p
          className='text-center text-sm mt-6'
          style={{ color: 'var(--color-text-muted)' }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href='/auth/signup'
            className='font-medium hover:underline'
            style={{ color: 'var(--color-primary)' }}
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Guest info modal */}
      {showGuestModal && (
        <GuestInfoModal onClose={() => setShowGuestModal(false)} />
      )}
    </>
  )
}

function LoadingCard() {
  return (
    <div
      className='flex flex-col items-center justify-center gap-3 py-16'
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        className='w-8 h-8 rounded-full border-2 animate-spin'
        style={{
          borderColor: 'var(--color-primary-muted)',
          borderTopColor: 'var(--color-primary)',
        }}
      />
      <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
        Signing you in…
      </p>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <path
          d='M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
      </g>
      <g className='icon-filled'>
        <path
          d='M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z'
          fill='currentColor'
        />
        <circle cx='12' cy='12' r='3' fill='white' />
      </g>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0120.94 15.94M14.12 14.12A3 3 0 119.88 9.88'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <line
        x1='3'
        y1='3'
        x2='21'
        y2='21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
        fill='#4285F4'
      />
      <path
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
        fill='#34A853'
      />
      <path
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
        fill='#FBBC05'
      />
      <path
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
        fill='#EA4335'
      />
    </svg>
  )
}

function GuestIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='2' />
        <path
          d='M4 20C4 17 7.58 14 12 14'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path
          d='M17 17L22 17M19.5 14.5L19.5 19.5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
      <g className='icon-filled'>
        <circle cx='12' cy='8' r='4' fill='currentColor' />
        <path
          d='M4 20C4 17 7.58 14 12 14'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path
          d='M17 17L22 17M19.5 14.5L19.5 19.5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
    </svg>
  )
}
