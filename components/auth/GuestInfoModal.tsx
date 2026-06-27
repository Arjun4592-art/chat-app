'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInAnonymously } from 'firebase/auth'
import { setDoc } from 'firebase/firestore'
import { auth } from '@/lib/firebase/config'
import { userDoc } from '@/lib/firebase/refs'
import { getAvatarColor, now } from '@/lib/utils/helper'
import type { User, Gender } from '@/types'

interface GuestInfoModalProps {
  onClose: () => void
}

type GenderOption = { value: Gender; label: string; icon: string }

const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'other', label: 'Other', icon: '⚧' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '–' },
]

export default function GuestInfoModal({ onClose }: GuestInfoModalProps) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validate() {
    if (!name.trim()) return 'Please enter your name.'
    if (name.trim().length < 2) return 'Name must be at least 2 characters.'
    if (!age) return 'Please enter your age.'
    const ageNum = Number(age)
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120)
      return 'Please enter a valid age (5–120).'
    if (!gender) return 'Please select your gender.'
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) return setError(err)

    setLoading(true)
    setError('')

    try {
      const cred = await signInAnonymously(auth)
      const uid = cred.user.uid

      const guestUser: User = {
        uid,
        name: name.trim(),
        email: null,
        photoURL: null,
        type: 'guest',
        online: true,
        lastSeen: now(),
        createdAt: now(),
        otpVerified: true,
        avatarColor: getAvatarColor(uid),
        age: Number(age),
        gender,
        logoutAt: null,
        deleteAt: null,
      }

      await setDoc(userDoc(uid), guestUser)
      onClose()
      router.push('/chat')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-40'
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        role='dialog'
        aria-modal='true'
        aria-labelledby='guest-modal-title'
      >
        <div
          className='w-full max-w-sm animate-scale-in'
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className='flex items-center justify-between px-5 py-4'
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className='flex items-center gap-2.5'>
              <div
                className='w-8 h-8 flex items-center justify-center'
                style={{
                  background: 'var(--color-primary-light)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <GuestIcon />
              </div>
              <h2
                id='guest-modal-title'
                className='font-heading font-semibold text-base'
                style={{ color: 'var(--color-text-primary)' }}
              >
                Continue as Guest
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label='Close'
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '4px',
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className='px-5 py-5 flex flex-col gap-4'>
            {/* Info */}
            <p
              className='text-xs'
              style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}
            >
              No account needed. Your data will be kept for{' '}
              <strong>30 minutes</strong> after logout.
            </p>

            {/* Error */}
            {error && (
              <div
                role='alert'
                className='text-xs px-3 py-2.5'
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

            {/* Name */}
            <div>
              <label
                htmlFor='guest-name'
                className='block text-sm font-medium mb-1.5'
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Display name
              </label>
              <input
                id='guest-name'
                type='text'
                autoFocus
                placeholder='What should we call you?'
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                maxLength={30}
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

            {/* Age */}
            <div>
              <label
                htmlFor='guest-age'
                className='block text-sm font-medium mb-1.5'
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Age
              </label>
              <input
                id='guest-age'
                type='number'
                placeholder='Your age'
                value={age}
                min={5}
                max={120}
                onChange={(e) => {
                  setAge(e.target.value)
                  setError('')
                }}
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

            {/* Gender */}
            <div>
              <p
                className='block text-sm font-medium mb-2'
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Gender
              </p>
              <div className='grid grid-cols-2 gap-2'>
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setGender(opt.value)
                      setError('')
                    }}
                    className='flex items-center gap-2 px-3 py-2.5 text-sm transition-all'
                    style={{
                      background:
                        gender === opt.value
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface)',
                      border: `1px solid ${gender === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      color:
                        gender === opt.value
                          ? 'var(--color-primary)'
                          : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontWeight: gender === opt.value ? 500 : 400,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>
                      {opt.icon}
                    </span>
                    <span className='text-xs'>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className='flex items-center justify-end gap-2 px-5 py-4'
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className='text-sm font-medium px-4 transition-all'
              style={{
                height: 'var(--input-height-sm)',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className='text-sm font-medium px-5 transition-all active:scale-[0.98]'
              style={{
                height: 'var(--input-height-sm)',
                background: loading
                  ? 'var(--color-primary-muted)'
                  : 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {loading ? 'Joining…' : 'Join as Guest'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GuestIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='12'
        cy='8'
        r='4'
        stroke='var(--color-primary)'
        strokeWidth='2'
      />
      <path
        d='M4 20C4 17 7.58 14 12 14'
        stroke='var(--color-primary)'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M17 17L22 17M19.5 14.5L19.5 19.5'
        stroke='var(--color-primary)'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M18 6L6 18M6 6L18 18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
