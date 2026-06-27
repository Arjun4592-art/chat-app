'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthProvider'
import { generateInviteCode, now } from '@/lib/utils/helper'
import type { Chat } from '@/types'

interface NewGroupModalProps {
  onClose: () => void
}

export default function NewGroupModal({ onClose }: NewGroupModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCreate() {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) return setError('Please enter a group name.')
    if (trimmed.length < 3)
      return setError('Name must be at least 3 characters.')
    if (trimmed.length > 50)
      return setError('Name must be under 50 characters.')

    setLoading(true)
    setError('')

    try {
      const chatId = doc(db, 'chats', '_').id // generate random ID
      const inviteCode = generateInviteCode()
      const newChat: Chat = {
        id: chatId,
        type: 'group',
        name: trimmed,
        members: [user.uid],
        createdBy: user.uid,
        createdAt: now(),
        lastMessage: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        isPrivate: true,
        inviteCode,
        photoURL: null,
      }

      await setDoc(doc(db, 'chats', chatId), newChat)

      // Store invite
      await setDoc(doc(db, 'invites', inviteCode), {
        code: inviteCode,
        chatId,
        createdBy: user.uid,
        createdAt: now(),
        expiresAt: null,
      })

      onClose()
      router.push(`/chat/${chatId}`)
    } catch {
      setError('Failed to create group. Please try again.')
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
        aria-labelledby='new-group-title'
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
            <h2
              id='new-group-title'
              className='font-heading font-semibold text-base'
              style={{ color: 'var(--color-text-primary)' }}
            >
              New Group
            </h2>
            <button
              onClick={onClose}
              aria-label='Close'
              className='icon-btn p-1'
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div className='px-5 py-5 flex flex-col gap-4'>
            {/* Info badge */}
            <div
              className='flex items-start gap-2.5 px-3 py-2.5 text-xs'
              style={{
                background: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-muted)',
              }}
            >
              <InfoIcon />
              <p style={{ lineHeight: 1.5 }}>
                Groups are <strong>private</strong>. Others can join via invite
                link or by searching the exact name.
              </p>
            </div>

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

            {/* Name input */}
            <div>
              <label
                htmlFor='group-name'
                className='block text-sm font-medium mb-1.5'
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Group name
              </label>
              <input
                id='group-name'
                type='text'
                autoFocus
                placeholder='e.g. Design Team'
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
                maxLength={50}
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
              <p
                className='text-xs mt-1 text-right'
                style={{ color: 'var(--color-text-muted)' }}
              >
                {name.length}/50
              </p>
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
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className='text-sm font-medium px-4 transition-all active:scale-[0.98]'
              style={{
                height: 'var(--input-height-sm)',
                background:
                  loading || !name.trim()
                    ? 'var(--color-primary-muted)'
                    : 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {loading ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </div>
      </div>
    </>
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

function InfoIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0, marginTop: '1px' }}
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
