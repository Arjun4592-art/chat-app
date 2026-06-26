'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { setDoc } from 'firebase/firestore'
import { auth } from '@/lib/firebase/config'
import { userDoc } from '@/lib/firebase/refs'
import { getAvatarColor, now } from '@/lib/utils/helper'
import type { User } from '@/types'

export default function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clearError = () => setError('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    clearError()

    if (!name.trim()) return setError('Please enter your name.')
    if (!email) return setError('Please enter your email.')
    if (password.length < 8)
      return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name.trim() })

      const newUser: User = {
        uid: cred.user.uid,
        name: name.trim(),
        email,
        photoURL: null,
        type: 'registered',
        online: true,
        lastSeen: now(),
        createdAt: now(),
        otpVerified: false,
        avatarColor: getAvatarColor(cred.user.uid),
      }

      await setDoc(userDoc(cred.user.uid), newUser)

      // Send OTP
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name.trim() }),
      })

      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(email)}&uid=${cred.user.uid}`,
      )
    } catch (err: unknown) {
      setLoading(false)
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use')
        setError('This email is already registered.')
      else if (code === 'auth/weak-password') setError('Password is too weak.')
      else setError('Something went wrong. Please try again.')
    }
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

      <form onSubmit={handleSignup} noValidate className='flex flex-col gap-4'>
        {/* Name */}
        <div>
          <label
            htmlFor='name'
            className='block text-sm font-medium mb-1.5'
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Full name
          </label>
          <input
            id='name'
            type='text'
            autoComplete='name'
            placeholder='Arjun Kumar'
            value={name}
            onChange={(e) => {
              setName(e.target.value)
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

        {/* Email */}
        <div>
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

        {/* Password */}
        <div>
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
              autoComplete='new-password'
              placeholder='Min. 8 characters'
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
              className='absolute right-3 top-1/2 -translate-y-1/2'
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '4px',
              }}
            >
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div>
          <label
            htmlFor='confirm'
            className='block text-sm font-medium mb-1.5'
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Confirm password
          </label>
          <input
            id='confirm'
            type={showPass ? 'text' : 'password'}
            autoComplete='new-password'
            placeholder='Re-enter password'
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
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

        <button
          type='submit'
          disabled={loading}
          className='w-full text-sm font-medium transition-all active:scale-[0.98] mt-2'
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p
        className='text-center text-sm mt-6'
        style={{ color: 'var(--color-text-muted)' }}
      >
        Already have an account?{' '}
        <Link
          href='/auth/login'
          className='font-medium hover:underline'
          style={{ color: 'var(--color-primary)' }}
        >
          Login
        </Link>
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
