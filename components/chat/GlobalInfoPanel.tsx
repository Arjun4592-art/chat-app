'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateDoc, arrayRemove, getDoc } from 'firebase/firestore'
import { chatDoc, userDoc } from '@/lib/firebase/refs'
import { getInitials } from '@/lib/utils/helper'
import type { Chat, User } from '@/types'

interface GroupInfoPanelProps {
  chat: Chat
  currentUid: string
  onClose: () => void
}

export default function GroupInfoPanel({
  chat,
  currentUid,
  onClose,
}: GroupInfoPanelProps) {
  const router = useRouter()
  const [members, setMembers] = useState<User[]>([])
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    async function fetchMembers() {
      const users = await Promise.all(
        chat.members.map(async (uid) => {
          const snap = await getDoc(userDoc(uid))
          return snap.exists() ? (snap.data() as User) : null
        }),
      )
      setMembers(users.filter(Boolean) as User[])
    }
    fetchMembers()
  }, [chat.members])

  async function copyInvite() {
    if (!chat.inviteCode) return
    const url = `${window.location.origin}/join/${chat.inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function leaveGroup() {
    setLeaving(true)
    await updateDoc(chatDoc(chat.id), { members: arrayRemove(currentUid) })
    router.replace('/chat')
  }

  return (
    <aside
      className='flex flex-col flex-shrink-0 animate-slide-in-left'
      style={{
        width: '260px',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        overflowY: 'auto',
      }}
      aria-label='Group info'
    >
      {/* Header */}
      <div
        className='flex items-center justify-between px-4 py-3 flex-shrink-0'
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <h2
          className='font-heading font-semibold text-sm'
          style={{ color: 'var(--color-text-primary)' }}
        >
          Group Info
        </h2>
        <button
          onClick={onClose}
          aria-label='Close info panel'
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

      <div className='flex flex-col gap-5 p-4'>
        {/* Group name */}
        <div className='flex flex-col items-center gap-2 py-2'>
          <div
            className='avatar-purple flex items-center justify-center'
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '22px',
            }}
          >
            <GroupIcon />
          </div>
          <p
            className='font-heading font-semibold text-base'
            style={{ color: 'var(--color-text-primary)' }}
          >
            {chat.name}
          </p>
          <p className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
            {chat.members.length} member{chat.members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Invite link */}
        {chat.inviteCode && (
          <div>
            <p
              className='text-xs font-medium mb-2 uppercase tracking-wider'
              style={{ color: 'var(--color-text-muted)' }}
            >
              Invite Link
            </p>
            <button
              onClick={copyInvite}
              className='w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-all'
              style={{
                background: copied
                  ? 'var(--color-success-bg)'
                  : 'var(--color-bg)',
                border: `1px solid ${copied ? 'var(--color-success)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                color: copied
                  ? 'var(--color-success)'
                  : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'left',
              }}
            >
              {copied ? <CheckIcon /> : <LinkIcon />}
              {copied ? 'Link copied!' : 'Copy invite link'}
            </button>
          </div>
        )}

        {/* Members */}
        <div>
          <p
            className='text-xs font-medium mb-2 uppercase tracking-wider'
            style={{ color: 'var(--color-text-muted)' }}
          >
            Members
          </p>
          <div className='flex flex-col gap-1'>
            {members.map((member) => (
              <div
                key={member.uid}
                className='flex items-center gap-2.5 px-2 py-1.5'
              >
                <div
                  className={`avatar-${member.avatarColor} flex items-center justify-center text-xs font-semibold relative flex-shrink-0`}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                  }}
                >
                  {getInitials(member.name)}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${member.online ? 'status-online' : 'status-offline'}`}
                    aria-hidden='true'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <p
                    className='text-sm truncate'
                    style={{
                      color: 'var(--color-text-primary)',
                      fontWeight: member.uid === chat.createdBy ? 600 : 400,
                    }}
                  >
                    {member.name} {member.uid === currentUid ? '(you)' : ''}
                  </p>
                  {member.uid === chat.createdBy && (
                    <p
                      className='text-xs'
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Admin
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave group */}
        {currentUid !== chat.createdBy && (
          <button
            onClick={leaveGroup}
            disabled={leaving}
            className='w-full flex items-center justify-center gap-2 text-sm font-medium py-2 transition-all'
            style={{
              background: 'var(--color-error-bg)',
              border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              cursor: leaving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: leaving ? 0.6 : 1,
            }}
          >
            <LeaveIcon />
            {leaving ? 'Leaving…' : 'Leave group'}
          </button>
        )}
      </div>
    </aside>
  )
}

function CloseIcon() {
  return (
    <svg
      width='17'
      height='17'
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

function GroupIcon() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
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
  )
}

function LinkIcon() {
  return (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M10 13C10.83 14.11 12.11 14.83 13.5 14.97C14.89 15.11 16.28 14.65 17.31 13.73L20.31 10.73C22.19 8.78 22.15 5.67 20.22 3.78C18.29 1.89 15.18 1.93 13.29 3.86L11.75 5.39M14 11C13.17 9.89 11.89 9.17 10.5 9.03C9.11 8.89 7.72 9.35 6.69 10.27L3.69 13.27C1.81 15.22 1.85 18.33 3.78 20.22C5.71 22.11 8.82 22.07 10.71 20.14L12.24 18.61'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M20 6L9 17L4 12'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LeaveIcon() {
  return (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9M16 17L21 12L16 7M21 12H9'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
