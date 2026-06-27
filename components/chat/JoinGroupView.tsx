'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { inviteDoc, chatDoc } from '@/lib/firebase/refs'
import { useAuth } from '@/context/AuthProvider'
import type { Chat } from '@/types'

export default function JoinGroupView({ code }: { code: string }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<
    'loading' | 'joining' | 'error' | 'already'
  >('loading')
  const [chat, setChat] = useState<Chat | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/auth/login?redirect=/join/${code}`)
      return
    }
    resolveInvite()
  }, [authLoading, user])

  async function resolveInvite() {
    try {
      const invSnap = await getDoc(inviteDoc(code))
      if (!invSnap.exists()) {
        setError('This invite link is invalid or has expired.')
        setStatus('error')
        return
      }

      const inv = invSnap.data()
      const chatSnap = await getDoc(chatDoc(inv.chatId))
      if (!chatSnap.exists()) {
        setError('This group no longer exists.')
        setStatus('error')
        return
      }

      const chatData = { ...chatSnap.data(), id: chatSnap.id } as Chat
      setChat(chatData)

      if (chatData.members.includes(user!.uid)) {
        setStatus('already')
        setTimeout(() => router.replace(`/chat/${chatData.id}`), 1200)
        return
      }

      setStatus('joining')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  async function joinGroup() {
    if (!chat || !user) return
    await updateDoc(chatDoc(chat.id), { members: arrayUnion(user.uid) })
    router.replace(`/chat/${chat.id}`)
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center px-4'
      style={{ background: 'var(--color-surface)' }}
    >
      <div
        className='w-full max-w-sm animate-scale-in'
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              className='w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4'
              style={{
                borderColor: 'var(--color-primary-muted)',
                borderTopColor: 'var(--color-primary)',
              }}
            />
            <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
              Checking invite…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className='w-12 h-12 flex items-center justify-center mx-auto mb-4'
              style={{
                background: 'var(--color-error-bg)',
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
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='var(--color-error)'
                  strokeWidth='2'
                />
                <path
                  d='M15 9L9 15M9 9L15 15'
                  stroke='var(--color-error)'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </div>
            <p
              className='font-heading font-semibold mb-2'
              style={{ color: 'var(--color-text-primary)' }}
            >
              Invalid link
            </p>
            <p
              className='text-sm mb-5'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {error}
            </p>
            <button
              onClick={() => router.replace('/chat')}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            >
              Go to Chat
            </button>
          </>
        )}

        {status === 'already' && (
          <>
            <p
              className='font-heading font-semibold mb-2'
              style={{ color: 'var(--color-text-primary)' }}
            >
              Already a member!
            </p>
            <p className='text-sm' style={{ color: 'var(--color-text-muted)' }}>
              Redirecting to {chat?.name}…
            </p>
          </>
        )}

        {status === 'joining' && chat && (
          <>
            <div
              className='w-14 h-14 avatar-purple flex items-center justify-center mx-auto mb-4'
              style={{ borderRadius: 'var(--radius-lg)', fontSize: '24px' }}
            >
              <svg
                width='26'
                height='26'
                viewBox='0 0 24 24'
                fill='none'
                aria-hidden='true'
              >
                <circle
                  cx='9'
                  cy='7'
                  r='4'
                  stroke='currentColor'
                  strokeWidth='2'
                />
                <path
                  d='M3 21V19C3 16.79 4.79 15 7 15H11C13.21 15 15 16.79 15 19V21'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <path
                  d='M16 3.13C17.16 3.44 18 4.5 18 5.75C18 7 17.16 8.06 16 8.37M21 21V19C20.99 17.76 20.16 16.71 19 16.38'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </div>
            <p
              className='font-heading font-semibold text-lg mb-1'
              style={{ color: 'var(--color-text-primary)' }}
            >
              {chat.name}
            </p>
            <p
              className='text-sm mb-6'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {chat.members.length} member{chat.members.length !== 1 ? 's' : ''}{' '}
              · Private group
            </p>
            <button
              onClick={joinGroup}
              className='w-full text-sm font-medium transition-all active:scale-[0.98]'
              style={{
                height: 'var(--input-height)',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Join group
            </button>
          </>
        )}
      </div>
    </div>
  )
}
