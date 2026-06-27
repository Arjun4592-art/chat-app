'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { getInitials, formatLastSeen } from '@/lib/utils/helper'
import InviteMembersModal from '@/components/chat/InviteMemberModal'
import type { Chat, User } from '@/types'

interface ChatTopbarProps {
  chat: Chat | null
  otherUser: User | null
  onInfoOpen?: () => void
}

export default function ChatTopbar({
  chat,
  otherUser,
  onInfoOpen,
}: ChatTopbarProps) {
  const { user } = useAuth()
  const [showInvite, setShowInvite] = useState(false)

  if (!chat) return null

  const isGlobal = chat.type === 'global'
  const isDM = chat.type === 'dm'
  const isGroup = chat.type === 'group'

  const name = isGlobal
    ? 'Global Room'
    : isDM
      ? (otherUser?.name ?? 'Unknown')
      : (chat.name ?? 'Group')

  const avatarColor = isDM ? (otherUser?.avatarColor ?? 'purple') : 'purple'

  const subtitle = isGlobal
    ? 'Public room — messages auto-delete after 30 min'
    : isDM
      ? otherUser?.online
        ? 'Online'
        : `Last seen ${formatLastSeen(otherUser?.lastSeen ?? 0)}`
      : `${chat.members.length} member${chat.members.length !== 1 ? 's' : ''}`

  return (
    <>
      <header
        className='flex items-center gap-3 px-4 flex-shrink-0'
        style={{
          height: 'var(--topbar-height)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        {/* Avatar */}
        <div
          className={`avatar-${avatarColor} flex items-center justify-center font-semibold flex-shrink-0 relative`}
          style={{
            width: 'var(--avatar-md)',
            height: 'var(--avatar-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
          }}
        >
          {isGlobal ? (
            <GlobalIcon />
          ) : isDM && otherUser?.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
              }}
            />
          ) : isGroup ? (
            <GroupIcon />
          ) : (
            getInitials(name)
          )}

          {isDM && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${otherUser?.online ? 'status-online' : 'status-offline'}`}
              aria-hidden='true'
            />
          )}
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <p
            className='font-heading font-semibold text-sm truncate'
            style={{ color: 'var(--color-text-primary)' }}
          >
            {name}
          </p>
          <p
            className='text-xs truncate flex items-center gap-1'
            style={{
              color:
                isDM && otherUser?.online
                  ? 'var(--color-online)'
                  : 'var(--color-text-muted)',
            }}
          >
            {isDM && otherUser?.online && (
              <span
                className='w-1.5 h-1.5 rounded-full status-online inline-block'
                aria-hidden='true'
              />
            )}
            {subtitle}
          </p>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1 flex-shrink-0'>
          {isGroup && (
            <>
              <button
                onClick={onInfoOpen}
                className='icon-btn p-2 transition-colors'
                aria-label='Group info'
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <InfoIcon />
              </button>

              {/* Invite button — opens online members modal */}
              <button
                onClick={() => setShowInvite(true)}
                className='icon-btn flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-all'
                aria-label='Invite members'
                style={{
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <InviteIcon />
                Invite
              </button>
            </>
          )}
        </div>
      </header>

      {/* Invite modal */}
      {showInvite && chat && (
        <InviteMembersModal chat={chat} onClose={() => setShowInvite(false)} />
      )}
    </>
  )
}

function GlobalIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
      <path
        d='M2 12H22M12 2C9.33 7 9.33 17 12 22M12 2C14.67 7 14.67 17 12 22'
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
      width='16'
      height='16'
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

function InfoIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 8V12M12 16H12.01'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
      <g className='icon-filled'>
        <circle cx='12' cy='12' r='10' fill='currentColor' />
        <path
          d='M12 8V12M12 16H12.01'
          stroke='white'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
    </svg>
  )
}

function InviteIcon() {
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
      </g>
      <g className='icon-filled'>
        <path
          d='M16 21V19C16 17.9 15.58 16.84 14.83 16.05C14.08 15.26 13.06 14.83 12 14.83H5C3.94 14.83 2.92 15.26 2.17 16.05C1.42 16.84 1 17.9 1 19V21'
          fill='currentColor'
        />
        <circle cx='8.5' cy='7' r='4' fill='currentColor' />
        <path
          d='M20 8V14M17 11H23'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
    </svg>
  )
}
