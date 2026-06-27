'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'
import Sidebar from '@/components/sidebar/Sidebar'

interface ChatShellProps {
  children: React.ReactNode
}

export default function ChatShell({ children }: ChatShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Auth guard — extra 1s grace period for guest doc to save
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      // Give 1 second grace — guest doc might still be saving to Firestore
      redirectTimer.current = setTimeout(() => {
        router.replace('/auth/login')
      }, 1000)
    } else {
      // User exists — clear any pending redirect
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [user, loading, router])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [])

  if (loading) return <FullScreenLoader />

  // Still waiting for user doc (guest case)
  if (!user) return <FullScreenLoader />

  return (
    <div
      className='flex h-screen w-full overflow-hidden'
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className='fixed inset-0 z-20 md:hidden'
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300',
          'md:relative md:translate-x-0 md:z-auto',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
        aria-label='Chat navigation'
      >
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <main className='flex-1 flex flex-col min-w-0 overflow-hidden'>
        {/* Mobile topbar */}
        <div
          className='flex items-center gap-3 px-4 md:hidden'
          style={{
            height: 'var(--topbar-height)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className='icon-btn p-1.5'
            aria-label='Open sidebar'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            <MenuIcon />
          </button>
          <span
            className='font-heading font-semibold text-base'
            style={{ color: 'var(--color-text-primary)' }}
          >
            ChatSpace
          </span>
        </div>

        {/* Page content */}
        <div className='flex-1 overflow-hidden'>{children}</div>
      </main>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div
      className='flex h-screen w-full items-center justify-center'
      style={{ background: 'var(--color-surface)' }}
    >
      <div className='flex flex-col items-center gap-3'>
        <div
          className='w-10 h-10 rounded-full border-2 animate-spin'
          style={{
            borderColor: 'var(--color-primary-muted)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
        <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <line
          x1='3'
          y1='6'
          x2='21'
          y2='6'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <line
          x1='3'
          y1='12'
          x2='21'
          y2='12'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <line
          x1='3'
          y1='18'
          x2='21'
          y2='18'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
      <g className='icon-filled'>
        <rect
          x='3'
          y='5'
          width='18'
          height='2.5'
          rx='1.25'
          fill='currentColor'
        />
        <rect
          x='3'
          y='11'
          width='18'
          height='2.5'
          rx='1.25'
          fill='currentColor'
        />
        <rect
          x='3'
          y='17'
          width='18'
          height='2.5'
          rx='1.25'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}
