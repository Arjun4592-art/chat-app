'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'
import { getInitials } from '@/lib/utils/helper'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    setOut(true)
    await logout()
    router.replace('/auth/login')
  }

  if (!user) return null

  return (
    <div ref={ref} className='relative px-3 py-3'>
      <button
        onClick={() => setOpen((o) => !o)}
        className='w-full flex items-center gap-2.5 px-2 py-2 transition-colors'
        style={{
          background: open ? 'var(--color-primary-light)' : 'none',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          textAlign: 'left',
        }}
        aria-expanded={open}
        aria-haspopup='menu'
      >
        {/* Avatar */}
        <div
          className={`avatar-${user.avatarColor} flex items-center justify-center text-xs font-semibold flex-shrink-0`}
          style={{
            width: 'var(--avatar-sm)',
            height: 'var(--avatar-sm)',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
          }}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
              }}
            />
          ) : (
            getInitials(user.name)
          )}
          <span
            className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white status-online'
            aria-hidden='true'
          />
        </div>

        <div className='flex-1 min-w-0'>
          <p
            className='text-sm font-medium truncate'
            style={{ color: 'var(--color-text-primary)' }}
          >
            {user.name}
          </p>
          <p
            className='text-xs truncate'
            style={{ color: 'var(--color-text-muted)' }}
          >
            {user.type === 'guest' ? 'Guest' : (user.email ?? '')}
          </p>
        </div>

        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className='absolute bottom-full left-3 right-3 mb-1 animate-scale-in'
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            zIndex: 50,
          }}
          role='menu'
        >
          {/* Profile info */}
          <div
            className='px-3 py-3'
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <p
              className='text-xs font-medium'
              style={{ color: 'var(--color-text-muted)' }}
            >
              Signed in as
            </p>
            <p
              className='text-sm font-medium mt-0.5 truncate'
              style={{ color: 'var(--color-text-primary)' }}
            >
              {user.type === 'guest' ? 'Guest User' : (user.email ?? user.name)}
            </p>
          </div>

          {/* Guest badge */}
          {user.type === 'guest' && (
            <div
              className='px-3 py-2'
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span
                className='inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5'
                style={{
                  background: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <GuestBadgeIcon />
                Guest — data expires after logout
              </span>
            </div>
          )}

          {/* Actions */}
          <div className='p-1'>
            {user.type === 'guest' && (
              <MenuItem
                icon={<RegisterIcon />}
                label='Create account'
                onClick={() => {
                  setOpen(false)
                  router.push('/auth/signup')
                }}
              />
            )}
            <MenuItem
              icon={<LogoutIcon />}
              label={loggingOut ? 'Logging out…' : 'Logout'}
              onClick={handleLogout}
              danger
              disabled={loggingOut}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role='menuitem'
      className='w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors'
      style={{
        background: 'none',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: danger ? 'var(--color-error)' : 'var(--color-text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        opacity: disabled ? 0.6 : 1,
        textAlign: 'left',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 200ms',
        flexShrink: 0,
        color: 'var(--color-text-muted)',
      }}
    >
      <path
        d='M6 9L12 15L18 9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16 17L21 12L16 7'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <line
        x1='21'
        y1='12'
        x2='9'
        y2='12'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function RegisterIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M16 21V19C16 17.9 15.58 16.84 14.83 16.05C14.08 15.26 13.06 14.83 12 14.83H5C3.94 14.83 2.92 15.26 2.17 16.05C1.42 16.84 1 17.9 1 19V21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <circle cx='8.5' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
      <path
        d='M20 8V14M17 11H23'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GuestBadgeIcon() {
  return (
    <svg
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
      <path
        d='M12 8V12M12 16H12.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
