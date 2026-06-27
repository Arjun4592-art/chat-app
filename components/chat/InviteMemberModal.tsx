'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  arrayUnion,
  type CollectionReference,
} from 'firebase/firestore'
import { addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthProvider'
import { messagesCol } from '@/lib/firebase/refs'
import { getInitials, now } from '@/lib/utils/helper'
import type { User, Chat, Message } from '@/types'

interface InviteMembersModalProps {
  chat: Chat
  onClose: () => void
}

export default function InviteMembersModal({
  chat,
  onClose,
}: InviteMembersModalProps) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Realtime online users not already in group
  useEffect(() => {
    const q = query(collection(db, 'users'), where('online', '==', true))
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs
        .map((d) => d.data() as User)
        .filter((u) => u.uid !== user?.uid && !chat.members.includes(u.uid))
      setOnlineUsers(users)
    })
    return () => unsub()
  }, [chat.members, user?.uid])

  async function inviteUser(invitee: User) {
    if (!user) return
    setLoading(invitee.uid)
    try {
      const { chatDoc } = await import('@/lib/firebase/refs')
      await updateDoc(chatDoc(chat.id), { members: arrayUnion(invitee.uid) })

      const systemMsg: Omit<Message, 'id'> = {
        chatId: chat.id,
        senderId: user.uid,
        senderName: user.name,
        senderAvatarColor: user.avatarColor,
        type: 'system',
        text: `${user.name} added ${invitee.name} to the group`,
        fileURL: null,
        fileName: null,
        createdAt: now(),
        readBy: [],
        deleted: false,
      }

      await addDoc(messagesCol(chat.id), systemMsg)
      setInvited((prev) => new Set([...prev, invitee.uid]))
    } catch (err) {
      console.error('Invite error:', err)
    } finally {
      setLoading(null)
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
        aria-labelledby='invite-modal-title'
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
            <div>
              <h2
                id='invite-modal-title'
                className='font-heading font-semibold text-base'
                style={{ color: 'var(--color-text-primary)' }}
              >
                Invite to {chat.name}
              </h2>
              <p
                className='text-xs mt-0.5'
                style={{ color: 'var(--color-text-muted)' }}
              >
                Online people not in this group
              </p>
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

          {/* List */}
          <div className='p-3 flex flex-col gap-1 max-h-80 overflow-y-auto'>
            {onlineUsers.length === 0 ? (
              <p
                className='text-sm text-center py-8'
                style={{ color: 'var(--color-text-muted)' }}
              >
                No online users to invite
              </p>
            ) : (
              onlineUsers.map((u) => {
                const isInvited = invited.has(u.uid)
                const isLoading = loading === u.uid
                return (
                  <div
                    key={u.uid}
                    className='flex items-center gap-3 px-3 py-2'
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {/* Avatar */}
                    <div
                      className={`avatar-${u.avatarColor} flex items-center justify-center font-semibold relative flex-shrink-0`}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '11px',
                      }}
                    >
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        getInitials(u.name)
                      )}
                      <span
                        className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white status-online'
                        aria-hidden='true'
                      />
                    </div>

                    {/* Name */}
                    <div className='flex-1 min-w-0'>
                      <p
                        className='text-sm font-medium truncate'
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {u.name}
                      </p>
                      {u.type === 'guest' && (
                        <p
                          className='text-xs'
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Guest
                        </p>
                      )}
                    </div>

                    {/* Invite button */}
                    <button
                      onClick={() => !isInvited && inviteUser(u)}
                      disabled={isInvited || isLoading}
                      className='text-xs font-medium px-3 py-1.5 transition-all flex-shrink-0'
                      style={{
                        background: isInvited
                          ? 'var(--color-success-bg)'
                          : 'var(--color-primary)',
                        color: isInvited ? 'var(--color-success)' : 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor:
                          isInvited || isLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-body)',
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      {isLoading ? '…' : isInvited ? 'Added ✓' : 'Invite'}
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div
            className='px-5 py-3'
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              onClick={onClose}
              className='w-full text-sm font-medium py-2 transition-all'
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Done
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
