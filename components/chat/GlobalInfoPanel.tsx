'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection,
  onSnapshot,
  query,
  where,
  setDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthProvider'
import { getDmChatId, getInitials, now } from '@/lib/utils/helper'
import type { User, Chat } from '@/types'

export default function GlobalInfoPanel({
  chatMembers,
}: {
  chatMembers: string[]
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<User[]>([])
  const [dmLoading, setDmLoading] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('online', '==', true))
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs
        .map((d) => d.data() as User)
        .filter((u) => u.uid !== user?.uid)
      setMembers(users)
    })
    return () => unsub()
  }, [user?.uid])

  async function startDM(otherUser: User) {
    if (!user) return
    setDmLoading(otherUser.uid)
    try {
      const chatId = getDmChatId(user.uid, otherUser.uid)
      const dmRef = doc(db, 'chats', chatId)

      // Always setDoc with merge — avoids getDoc permission issue on non-existent doc
      const dm: Chat = {
        id: chatId,
        type: 'dm',
        name: null,
        members: [user.uid, otherUser.uid],
        createdBy: user.uid,
        createdAt: now(),
        lastMessage: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        isPrivate: true,
        inviteCode: null,
        photoURL: null,
      }

      // merge: true — agar already exist karta hai toh overwrite nahi hoga
      await setDoc(dmRef, dm, { merge: true })
      router.push(`/chat/${chatId}`)
    } catch (err) {
      console.error('DM error:', err)
    } finally {
      setDmLoading(null)
    }
  }

  return (
    <aside
      className='flex flex-col flex-shrink-0'
      style={{
        width: '220px',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        overflowY: 'auto',
      }}
      aria-label='Online members'
    >
      <div
        className='px-4 py-3 flex-shrink-0'
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className='font-heading font-semibold text-sm'
          style={{ color: 'var(--color-text-primary)' }}
        >
          Online
        </p>
        <p
          className='text-xs mt-0.5'
          style={{ color: 'var(--color-text-muted)' }}
        >
          {members.length} {members.length === 1 ? 'person' : 'people'} online
        </p>
      </div>

      <div className='flex flex-col gap-1 p-2'>
        {members.length === 0 ? (
          <p
            className='text-xs px-2 py-4 text-center'
            style={{ color: 'var(--color-text-muted)' }}
          >
            No one else online
          </p>
        ) : (
          members.map((member) => (
            <button
              key={member.uid}
              onClick={() => startDM(member)}
              disabled={dmLoading === member.uid}
              className='flex items-center gap-2.5 px-2 py-2 w-full text-left transition-colors'
              style={{
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: dmLoading === member.uid ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
              }}
              title={`Message ${member.name}`}
            >
              <div
                className={`avatar-${member.avatarColor} flex items-center justify-center font-semibold relative flex-shrink-0`}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '10px',
                }}
              >
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  getInitials(member.name)
                )}
                <span
                  className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white status-online'
                  aria-hidden='true'
                />
              </div>

              <div className='flex-1 min-w-0'>
                <p
                  className='text-xs font-medium truncate'
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {member.name}
                </p>
                {member.type === 'guest' && (
                  <p
                    className='text-xs'
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Guest
                  </p>
                )}
              </div>

              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {dmLoading === member.uid ? (
                  <div
                    className='w-3 h-3 rounded-full border-2 border-t-transparent animate-spin'
                    style={{
                      borderColor: 'var(--color-primary-muted)',
                      borderTopColor: 'var(--color-primary)',
                    }}
                  />
                ) : (
                  <DMIcon />
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}

function DMIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <path
          d='M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <g className='icon-filled'>
        <path
          d='M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}
